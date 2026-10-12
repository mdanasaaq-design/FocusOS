const authBase = process.env.FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099";
const firestoreBase = process.env.FIRESTORE_EMULATOR_URL || "http://127.0.0.1:8080";
const projectId = process.env.GCLOUD_PROJECT || "demo-focusos";
const apiKey = "demo-api-key";

async function signUp(email) {
  const response = await fetch(
    `${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "FocusOS-rules-test-2026!", returnSecureToken: true }),
    }
  );
  const payload = await response.json();
  if (!response.ok || !payload.localId || !payload.idToken) {
    throw new Error(`Unable to create Firestore rules test user: ${JSON.stringify(payload)}`);
  }
  return { uid: payload.localId, token: payload.idToken };
}

async function writeProbe(uid, token) {
  const url = `${firestoreBase}/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/rulesTest/probe`;
  return fetch(url, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      fields: { verified: { booleanValue: true } },
    }),
  });
}

const owner = await signUp(`rules-owner-${Date.now()}@focusos.test`);
const other = await signUp(`rules-other-${Date.now()}@focusos.test`);

const ownWrite = await writeProbe(owner.uid, owner.token);
if (!ownWrite.ok) {
  throw new Error(`Expected owner write to succeed; received ${ownWrite.status}: ${await ownWrite.text()}`);
}

const crossUserWrite = await writeProbe(other.uid, owner.token);
if (crossUserWrite.ok) {
  throw new Error("Security failure: a user wrote to another user's Firestore subtree.");
}

const unauthenticatedWrite = await writeProbe(`unauthenticated-${Date.now()}`, null);
if (unauthenticatedWrite.ok) {
  throw new Error("Security failure: an unauthenticated write was accepted.");
}

console.log("Firestore ownership rules passed: owner write allowed; cross-user and unauthenticated writes denied.");

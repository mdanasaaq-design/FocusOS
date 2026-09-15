export default function ComingSoon({ title, note }) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-display font-semibold mb-2">{title}</h2>
      <div className="card p-8 text-center mt-6">
        <p className="text-sm text-parchment-300">
          {note || "This module is being built in the next update batch."}
        </p>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 rounded-full bg-black/[0.06]" />
      <div className="h-4 w-64 rounded-full bg-black/[0.05]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="h-36 rounded-3xl bg-black/[0.05]" />
        <div className="h-36 rounded-3xl bg-black/[0.05]" />
        <div className="col-span-2 h-24 rounded-3xl bg-black/[0.04] sm:col-span-1" />
      </div>
    </div>
  );
}

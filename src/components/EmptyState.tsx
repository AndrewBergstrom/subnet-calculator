export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-ahead-blue/10 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-ahead-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">Subnet Calculator</h2>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-md mb-8 leading-relaxed">
        Enter a network CIDR in the header to get started. Split subnets, add labels and colors,
        organize with groups, and export your configurations.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg">
        {[
          { title: 'Split & Join', desc: 'Visually split subnets into smaller blocks or join them back' },
          { title: 'Color & Label', desc: 'Annotate subnets with colors, labels, and notes in-place' },
          { title: 'Cloud Aware', desc: 'Azure & AWS modes account for reserved IPs per subnet' },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-[var(--color-border)] p-3 text-left">
            <div className="text-xs font-semibold mb-1">{f.title}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

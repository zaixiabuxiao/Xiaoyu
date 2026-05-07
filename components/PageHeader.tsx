type Props = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-4">
      {subtitle ? (
        <p className="font-pixel text-[10px] text-warm-orange tracking-widest">
          {subtitle}
        </p>
      ) : null}
      <h1 className="font-pixel text-lg mt-1">{title}</h1>
      <div className="pixel-divider mt-3" />
    </header>
  );
}

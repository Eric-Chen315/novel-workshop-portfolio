type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  center = true,
}: SectionHeadingProps) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? (
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-blue-300/80">{eyebrow}</p>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold text-white md:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">{description}</p>
      ) : null}
    </div>
  );
}

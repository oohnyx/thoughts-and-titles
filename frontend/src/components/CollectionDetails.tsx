export function TagLabel({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`collection-tag ${className}`}><span aria-hidden="true" className="collection-tag__pin" />{children}</span>;
}

export function RewatchRibbon({ className = "" }: { className?: string }) {
  return <span aria-label="Rewatched" className={`collection-ribbon ${className}`} />;
}

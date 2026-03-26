export default function Card({ children, className = "" }) {
  return (
    <div className={`card bg-[#323232] border border-border rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

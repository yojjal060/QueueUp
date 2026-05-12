interface StatusBannerProps {
  tone: "info" | "success" | "error";
  title: string;
  message: string;
}

const toneClasses = {
  info: "border-[#9ee8e8]/20 bg-[#176a6b]/12 text-[#d9fffe]",
  success: "border-[#9ee8e8]/18 bg-[#0f3b3b]/22 text-[#d9fffe]",
  error: "border-[#ffb59f]/20 bg-[#802a0d]/16 text-[#fff6ee]",
};

export function StatusBanner({ tone, title, message }: StatusBannerProps) {
  return (
    <div className={`glass-panel-soft px-4 py-4 ${toneClasses[tone]}`}>
      <p className="font-caps text-[11px] uppercase tracking-[0.28em]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/78">{message}</p>
    </div>
  );
}

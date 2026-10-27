export default function AuthIllustration({ variant = "login" }) {
  const isSignup = variant === "signup";

  return (
    <div className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#dff3ea] via-[#dcefe9] to-[#f8ecd9] p-6 sm:min-h-80 sm:p-8 lg:min-h-[38rem] lg:rounded-[2rem] lg:p-9">
      <div className="absolute inset-0 opacity-40" aria-hidden="true" style={{ backgroundImage: "radial-gradient(#5f9b86 0.8px, transparent 0.8px)", backgroundSize: "18px 18px" }} />
      <div className="absolute -right-14 -top-14 size-56 rounded-full bg-[#fff4c9]/80 blur-2xl" aria-hidden="true" />
      <div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-bold tracking-wide text-teal-900 shadow-sm backdrop-blur">
        <span className="grid size-6 place-items-center rounded-full bg-teal-700 text-white">m</span>
        MindHaven
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[25rem] py-3">
        <svg viewBox="0 0 500 360" role="img" aria-label="A cheerful sun, smiling cloud, and tiny growing plant" className="w-full drop-shadow-[0_16px_20px_rgba(54,91,76,0.12)]">
          <ellipse cx="250" cy="320" rx="194" ry="22" fill="#6F9F84" opacity=".18" />
          <circle cx="385" cy="76" r="42" fill="#F8CA69" />
          <g className="auth-float" style={{ transformOrigin: "385px 76px" }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <path key={angle} d="M385 18v-9" stroke="#E4A84D" strokeWidth="4" strokeLinecap="round" transform={`rotate(${angle} 385 76)`} />
            ))}
            <circle cx="371" cy="75" r="3" fill="#5A5146" />
            <circle cx="399" cy="75" r="3" fill="#5A5146" />
            <path d="M375 88q10 10 20 0" fill="none" stroke="#5A5146" strokeWidth="3" strokeLinecap="round" />
          </g>
          <path d="M0 245c76-54 151-44 226-7s160 41 274-17v139H0Z" fill="#9BC5A4" />
          <path d="M0 282c81-35 142-18 226 13 83 31 182 22 274-14v79H0Z" fill="#76AA8C" />
          <path d="M0 320c103-28 181-9 250 4 91 17 166-8 250-23v59H0Z" fill="#548A70" />

          <g className="auth-float">
            <path d="M106 137c-25 0-43 15-43 35s18 34 43 34h136c22 0 38-13 38-31 0-17-15-30-34-31-7-25-27-41-55-41-26 0-46 14-55 37-8-2-19-3-30-3Z" fill="#FCFEF8" stroke="#8BBDA7" strokeWidth="5" strokeLinejoin="round" />
            <circle cx="133" cy="168" r="4" fill="#52675D" />
            <circle cx="170" cy="168" r="4" fill="#52675D" />
            <path d="M139 183q13 13 26 0" fill="none" stroke="#52675D" strokeWidth="4" strokeLinecap="round" />
            <circle cx="119" cy="181" r="6" fill="#F0B0A0" />
            <circle cx="184" cy="181" r="6" fill="#F0B0A0" />
          </g>

          <g className="auth-sway" style={{ transformOrigin: "326px 274px" }}>
            <path d="M325 292v-61" stroke="#548A70" strokeWidth="7" strokeLinecap="round" />
            <path d="M324 262c-32-37-54-16-47 4 18 14 36 11 47-4Zm3-13c27-33 47-15 40 4-15 12-29 10-40-4Z" fill="#8FBD83" stroke="#598C68" strokeWidth="3" strokeLinejoin="round" />
            <ellipse cx="325" cy="300" rx="40" ry="16" fill="#CC8B72" />
            <path d="M286 299h78l-8 35h-62Z" fill="#EC9A89" stroke="#BB6E68" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="310" cy="314" r="3" fill="#60464A" />
            <circle cx="340" cy="314" r="3" fill="#60464A" />
            <path d="M315 324q10 9 20 0" fill="none" stroke="#60464A" strokeWidth="3" strokeLinecap="round" />
            <circle cx="302" cy="322" r="4" fill="#F7C0AE" />
            <circle cx="348" cy="322" r="4" fill="#F7C0AE" />
          </g>

          <g fill="#FFF9E8">
            <path d="m73 93 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" />
            <path d="m288 66 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
            <circle cx="442" cy="167" r="4" />
            <circle cx="48" cy="201" r="3" />
          </g>
          <g fill="#F9D783">
            <circle cx="244" cy="105" r="5" />
            <circle cx="274" cy="129" r="3" />
            <circle cx="88" cy="248" r="4" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">A gentler kind of everyday</p>
        <h2 className="mt-2 font-[Playfair_Display] text-2xl font-bold leading-tight text-[#233f37] sm:text-3xl">
          {isSignup ? "There’s room for you to grow here." : "Take a breath. You’re right where you need to be."}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[#49665b]">
          {isSignup
            ? "Build small rituals, find kind support, and make this space your own."
            : "Your private space for small steps, honest check-ins, and kinder days."}
        </p>
      </div>
    </div>
  );
}

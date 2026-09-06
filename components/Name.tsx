type ColourCss = { color?: string; gradient?: [string, string]; rainbow?: boolean; chrome?: boolean; glitch?: boolean; glow?: boolean };

// Renders a username with its owned/equipped colour + one-shot entry
// animation. No client JS needed — CSS keyframes (globals.css) handle both
// the continuous colour treatments (rainbow/chrome/glitch) and the
// once-only entry animations.
export function Name({
  username,
  colourCss,
  animClass,
}: {
  username: string;
  colourCss: ColourCss | null;
  animClass: string | null;
}) {
  let className = "font-medium";
  let style: React.CSSProperties = {};

  if (colourCss?.rainbow) className += " name-rainbow";
  else if (colourCss?.chrome) className += " name-chrome";
  else if (colourCss?.glitch) className += " name-glitch";
  else if (colourCss?.gradient) {
    className += " bg-clip-text text-transparent";
    style = { backgroundImage: `linear-gradient(90deg, ${colourCss.gradient[0]}, ${colourCss.gradient[1]})` };
  } else if (colourCss?.color) {
    style = { color: colourCss.color };
  }

  if (colourCss?.glow) style = { ...style, filter: "drop-shadow(0 0 6px currentColor)" };
  if (animClass) className += ` ${animClass}`;

  return (
    <span className={className} style={style}>
      {username}
    </span>
  );
}

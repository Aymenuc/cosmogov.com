import { Lightbulb, Trophy, WandSparkles } from "lucide-react";
import "./spark.css";

export function Marquee() {
  return (
    <div className="sc-marquee" aria-hidden="true">
      <span className="sc-ticket one">
        <Lightbulb />
      </span>
      <span className="sc-ticket two">
        <WandSparkles />
      </span>
      <span className="sc-ticket three">
        <Trophy />
      </span>
    </div>
  );
}

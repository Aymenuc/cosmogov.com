import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  Hammer,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
export default function MissionPreview() {
  return (
    <div className="community-preview mission-home-preview">
      <div className="preview-toolbar">
        <span>
          <span className="status-dot" />
          Riverside neighbors
        </span>
        <span className="preview-example">Illustrative mission</span>
      </div>
      <div className="mission-home-brief">
        <span>
          <Sparkles size={13} />A LITTLE IDEA, IN MOTION
        </span>
        <h3>
          Let’s make repair
          <br />
          the easy choice.
        </h3>
        <p>
          A repair café. Some curious neighbors.
          <br />
          And an AI team ready to help.
        </p>
        <span className="mission-home-flower" aria-hidden="true">
          ✳
        </span>
      </div>
      <div className="mission-home-team">
        <span>
          <Search />
          Scout
        </span>
        <span>
          <Users />
          Bridge
        </span>
        <span>
          <Hammer />
          Maker
        </span>
        <span>
          <Sparkles />
          Studio
        </span>
      </div>
      <div className="mission-home-output">
        <div>
          <span>
            <CheckCheck size={15} />
            FROM THE SHARED WORKBENCH
          </span>
          <small>Example output</small>
        </div>
        <h4>A useful first step, ready for people.</h4>
        <p>Find the skills and equipment your neighbors can offer.</p>
        <div>
          <Check size={14} />A participation form, built for this mission.
        </div>
      </div>
      <Link className="mission-home-link" href="/missions/demo">
        Step inside the mission <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}

import ImpactCounter from "./ImpactCounter";
import LiveStats from "./LiveStats";

import LiveTicker from "./LiveTicker";

export default function ImpactSection() {
  return (
    <section id="impact" className="  bg-black ">
       <LiveStats/>
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-5xl font-bold mb-6">Real-Time Feed</h2>
        {/* Your existing impact stats */}
      </div>
      <LiveTicker />
    </section>
  );
}

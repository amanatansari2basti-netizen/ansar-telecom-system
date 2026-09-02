import {
  PackageCheck,
  Bike,
  ScanLine,
  CheckCircle2,
} from "lucide-react";

import "../styles/pickDropFlowAnimation.css";

const steps = {
  en: [
    { icon: PackageCheck, label: "Request pickup" },
    { icon: Bike, label: "Technician arrives" },
    { icon: ScanLine, label: "Repair & track" },
    { icon: CheckCircle2, label: "Delivered back" },
  ],
  hi: [
    { icon: PackageCheck, label: "पिकअप रिक्वेस्ट करें" },
    { icon: Bike, label: "टेक्नीशियन आता है" },
    { icon: ScanLine, label: "रिपेयर व ट्रैकिंग" },
    { icon: CheckCircle2, label: "वापस डिलीवरी" },
  ],
};

function PickDropFlowAnimation({ language = "en" }) {
  const items = steps[language] || steps.en;

  return (
    <div className="at-flow">
      <div className="at-flow__badge">
        <span>CUSTOMER SERVICE</span>
        <strong>
          {language === "hi"
            ? "पिक एंड ड्रॉप + रिपेयर ट्रैकिंग"
            : "Pick & Drop + Repair Tracking"}
        </strong>
      </div>

      <div className="at-flow__row">
        {items.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              className="at-flow__step"
              style={{ animationDelay: `${index * 1.6}s` }}
              key={step.label}
            >
              <div className="at-flow__node">
                <Icon size={22} />
              </div>

              <span>{step.label}</span>

              {index < items.length - 1 && (
                <div
                  className="at-flow__connector"
                  style={{
                    animationDelay: `${index * 1.6 + 0.4}s`,
                  }}
                >
                  <div className="at-flow__connector-fill" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PickDropFlowAnimation;
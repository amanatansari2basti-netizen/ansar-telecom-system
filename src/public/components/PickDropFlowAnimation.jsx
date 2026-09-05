import { useState, useEffect } from "react";
import {
  Bike,
  Search,
  CheckCheck,
  Wrench,
  Truck,
} from "lucide-react";
import "../styles/pickDropFlowAnimation.css";

const steps = [
  {
    id: "pickup",
    num: "01",
    title: { en: "Doorstep Pickup", hi: "डोरस्टेप पिकअप" },
    subtitle: { en: "Rider picks device from your location", hi: "राइडर आपके पते से फोन कलेक्ट करता है" },
    icon: Bike,
    graphicState: "transit_in",
  },
  {
    id: "diagnose",
    num: "02",
    title: { en: "Workshop Diagnosis", hi: "वर्कशॉप जांच" },
    subtitle: { en: "Device tested & issue identified", hi: "वर्कशॉप में फोन की समस्या की सटीक जांच" },
    icon: Search,
    graphicState: "testing",
  },
  {
    id: "quote_repair",
    num: "03",
    title: { en: "Approval & Repair", hi: "अनुमति व रिपेयर" },
    subtitle: { en: "Cost shared with customer & repaired", hi: "खर्च बताकर मंजूरी मिलने पर रिपेयरिंग" },
    icon: Wrench,
    graphicState: "repairing",
  },
  {
    id: "delivery",
    num: "04",
    title: { en: "Safe Delivery", hi: "सुरक्षित डिलीवरी" },
    subtitle: { en: "Repaired phone delivered back to you", hi: "ठीक हुआ फोन सुरक्षित आपके घर तक डिलीवर" },
    icon: Truck,
    graphicState: "delivered",
  },
];

export default function PickDropFlowAnimation({ language = "en" }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  const current = steps[activeStep];
  const StepIcon = current.icon;

  return (
    <div className="at-clean-flow">
      {/* Visual Animation Stage */}
      <div className="at-clean-flow__stage">
        {/* Pathway track */}
        <div className="at-clean-flow__track">
          <div
            className="at-clean-flow__track-fill"
            style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Animated Visual Center */}
        <div className="at-clean-flow__centerpiece">
          <div className="at-clean-flow__icon-halo">
            <StepIcon size={40} className="at-clean-flow__icon" />
          </div>

          <div className="at-clean-flow__badge">
            <span className="at-clean-flow__step-tag">
              {language === "hi" ? `स्टेप ${current.num}` : `STEP ${current.num}`}
            </span>
          </div>

          <h3 className="at-clean-flow__title">
            {current.title[language] || current.title.en}
          </h3>

          <p className="at-clean-flow__subtitle">
            {current.subtitle[language] || current.subtitle.en}
          </p>
        </div>
      </div>

      {/* Clean 4-Step Bottom Progress Strip */}
      <div className="at-clean-flow__footer">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStep;
          const isPassed = idx < activeStep;

          return (
            <button
              key={step.id}
              type="button"
              className={`at-clean-flow__tab ${isActive ? "is-active" : ""} ${isPassed ? "is-passed" : ""}`}
              onClick={() => setActiveStep(idx)}
            >
              <div className="at-clean-flow__tab-icon">
                {isPassed ? <CheckCheck size={16} /> : <Icon size={16} />}
              </div>
              <div className="at-clean-flow__tab-text">
                <span className="at-clean-flow__tab-num">{step.num}</span>
                <span className="at-clean-flow__tab-title">
                  {step.title[language] || step.title.en}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

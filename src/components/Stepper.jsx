import React from "react";
import { Check } from "lucide-react";

function Stepper({ steps, currentStep }) {
  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-4 sm:p-6 shadow-xl mb-6">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center text-center min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                    isComplete
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrent
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span
                  className={`mt-2 text-xs sm:text-sm font-medium truncate ${
                    isCurrent
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel || step.id}</span>
                </span>
              </div>

              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mx-2 sm:mx-3 ${
                    index < currentStep
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Stepper;

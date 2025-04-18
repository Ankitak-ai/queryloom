
import React from 'react';
import { cn } from "@/lib/utils";

const ThemeToggle = () => {
  const [isDark, setIsDark] = React.useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
  };

  return (
    <div className="relative inline-block">
      <label className="relative block w-[60px] h-[34px] cursor-pointer">
        <input
          type="checkbox"
          className="opacity-0 w-0 h-0"
          checked={isDark}
          onChange={toggleTheme}
        />
        <div className={cn(
          "absolute inset-0 rounded-[34px] transition-colors duration-400 overflow-hidden",
          isDark ? "bg-black" : "bg-[#2196f3]"
        )}>
          <div className={cn(
            "absolute h-[26px] w-[26px] left-1 bottom-1 rounded-full transition-all duration-400",
            "before:content-[''] before:absolute before:inset-0 before:rounded-full",
            isDark ? "translate-x-[26px] bg-white animate-rotate-center" : "bg-yellow-300"
          )}>
            {/* Moon dots - only visible in dark mode */}
            {[
              { id: 1, size: "w-1.5 h-1.5", position: "left-2.5 top-0.5" },
              { id: 2, size: "w-2.5 h-2.5", position: "left-0.5 top-2.5" },
              { id: 3, size: "w-1 h-1", position: "left-4 top-4.5" }
            ].map(dot => (
              <div
                key={dot.id}
                className={cn(
                  "absolute rounded-full transition-opacity duration-400 bg-gray-400",
                  dot.size,
                  dot.position,
                  isDark ? "opacity-100" : "opacity-0"
                )}
              />
            ))}

            {/* Light rays - only visible in light mode */}
            {[
              { size: "w-[43px] h-[43px]", position: "-left-2 -top-2" },
              { size: "w-[55px] h-[55px]", position: "-left-1/2 -top-1/2" },
              { size: "w-[60px] h-[60px]", position: "-left-4.5 -top-4.5" }
            ].map((ray, index) => (
              <div
                key={index}
                className={cn(
                  "absolute rounded-full bg-white/10 -z-10 transition-opacity duration-400",
                  ray.size,
                  ray.position,
                  !isDark ? "opacity-100" : "opacity-0"
                )}
              />
            ))}

            {/* Clouds */}
            <div className="absolute inset-0">
              {[
                { dark: true, left: "30px", top: "15px", width: "40px" },
                { dark: true, left: "44px", top: "10px", width: "20px" },
                { dark: true, left: "18px", top: "24px", width: "30px" },
                { dark: false, left: "36px", top: "18px", width: "40px" },
                { dark: false, left: "48px", top: "14px", width: "20px" },
                { dark: false, left: "22px", top: "26px", width: "30px" }
              ].map((cloud, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute rounded-full animate-cloud-move",
                    cloud.dark ? "bg-gray-300" : "bg-gray-100",
                    "w-[" + cloud.width + "] h-[" + cloud.width + "]",
                    "left-[" + cloud.left + "] top-[" + cloud.top + "]",
                    !isDark ? "opacity-100" : "opacity-0"
                  )}
                  style={{ 
                    animationDelay: cloud.dark ? '1s' : '0s'
                  }}
                />
              ))}
            </div>

            {/* Stars */}
            <div className={cn(
              "transform transition-all duration-400",
              isDark ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
            )}>
              {[
                { size: "w-5", position: "top-0.5 left-0.5", delay: "300ms" },
                { size: "w-1.5", position: "top-4 left-0.5", delay: "0ms" },
                { size: "w-3", position: "top-5 left-2.5", delay: "600ms" },
                { size: "w-4.5", position: "top-0 left-4.5", delay: "1300ms" }
              ].map((star, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute bg-white rounded-full animate-star-twinkle",
                    star.size,
                    star.position
                  )}
                  style={{ animationDelay: star.delay }}
                />
              ))}
            </div>
          </div>
        </div>
      </label>
    </div>
  );
};

export default ThemeToggle;

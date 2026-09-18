document.addEventListener("DOMContentLoaded", () => {

        // Robust Slider Logic with Interaction Overlay
        const sliderRoot = document.getElementById("slider-root");
        const sliderOverlay = document.getElementById("slider-overlay");
        const sliderInnerImg = document.getElementById("slider-inner-img");
        const sliderHandle = document.getElementById("slider-handle");
        const sliderCTA = document.getElementById("slider-cta");
        const sliderSuccessCTA = document.getElementById("slider-success-cta");

        if (sliderRoot) {
          let isDragging = false;
          let hasInteracted = false;

          const syncImageWidth = () => {
            if (sliderInnerImg && sliderRoot) {
              sliderInnerImg.style.width = `${sliderRoot.offsetWidth}px`;
            }
          };

          window.addEventListener("resize", syncImageWidth);
          syncImageWidth();

          const revealSuccessCTA = () => {
            if (!hasInteracted) {
              hasInteracted = true;
              if (sliderCTA) sliderCTA.style.opacity = "0";
              if (sliderSuccessCTA) {
                sliderSuccessCTA.style.opacity = "1";
                sliderSuccessCTA.style.pointerEvents = "auto";
                sliderSuccessCTA.style.bottom = "-80px";
              }
            }
          };

          const updateSlider = (clientX) => {
            const rect = sliderRoot.getBoundingClientRect();
            const x = clientX - rect.left;
            let percent = (x / rect.width) * 100;
            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;

            sliderOverlay.style.width = percent + "%";
            sliderHandle.style.left = percent + "%";
          };

          const startDrag = (e) => {
            isDragging = true;
            revealSuccessCTA();
            updateSlider(e.clientX || e.touches[0].clientX);
          };

          const stopDrag = () => {
            isDragging = false;
          };

          const moveDrag = (e) => {
            if (!isDragging) return;
            updateSlider(e.clientX || e.touches[0].clientX);
          };

          sliderRoot.addEventListener("mousedown", startDrag);
          window.addEventListener("mouseup", stopDrag);
          window.addEventListener("mousemove", moveDrag);

          sliderRoot.addEventListener("touchstart", startDrag, {
            passive: true,
          });
          window.addEventListener("touchend", stopDrag);
          window.addEventListener("touchmove", moveDrag, { passive: true });
        }

        // Territory Interaction
        const selectors = document.querySelectorAll(".ledger-item");
        selectors.forEach((item) => {
          const activateItem = () => {
            const target = item.getAttribute("data-target");
            selectors.forEach((s) => s.classList.remove("active"));

            // Reset Map Nodes
            document.querySelectorAll(".map-node").forEach((el) => {
              el.classList.remove("opacity-100");
              el.classList.add("opacity-50");
            });

            // Reset Data Cards
            document.querySelectorAll(".data-card").forEach((card) => {
              card.classList.remove("opacity-100", "translate-y-0");
              card.classList.add("opacity-0", "translate-y-4");
            });

            // Activate Selection
            item.classList.add("active");

            // Activate Specific Node
            const node = document.getElementById(`node-${target}`);
            if (node) {
              node.classList.remove("opacity-50");
              node.classList.add("opacity-100");
            }

            // Activate Specific Data Card
            const card = document.getElementById(`data-${target}`);
            if (card) {
              card.classList.remove("opacity-0", "translate-y-4");
              card.classList.add("opacity-100", "translate-y-0");
            }
          };

          item.addEventListener("mouseenter", activateItem);
          item.addEventListener("click", activateItem);
        });

        // --- PHASE TOGGLE LOGIC ---
        const phaseTabs = document.querySelectorAll(".phase-tab");
        const phaseContents = document.querySelectorAll(".phase-content");

        if (phaseTabs.length > 0) {
          phaseTabs.forEach((tab) => {
            tab.addEventListener("click", () => {
              const targetId = tab.getAttribute("data-target");

              // Reset Tabs
              phaseTabs.forEach((t) => {
                t.classList.remove("active", "bg-white/10");
                t.querySelector(".text-gold").classList.remove("scale-110"); // Reset scale if using that class
              });

              // Activate Clicked Tab
              tab.classList.add("active", "bg-white/10");

              // Reset Content
              phaseContents.forEach((content) => {
                content.classList.remove("opacity-100", "z-10");
                content.classList.add(
                  "opacity-0",
                  "pointer-events-none",
                  "z-0"
                );
              });

              // Activate Target Content
              const targetContent = document.getElementById(targetId);
              if (targetContent) {
                targetContent.classList.remove(
                  "opacity-0",
                  "pointer-events-none",
                  "z-0"
                );
                targetContent.classList.add("opacity-100", "z-10");
              }
            });
          });
        }

        // --- FAQ COLLAPSIBLE LOGIC ---
        const faqItems = document.querySelectorAll(".faq-item");
        if (faqItems.length > 0) {
          faqItems.forEach((item) => {
            const button = item.querySelector("button");
            const answer = item.querySelector(".faq-answer");
            const icon = item.querySelector(".icon-plus");
            const title = item.querySelector("h3");

            button.addEventListener("click", () => {
              const isOpen = answer.classList.contains("grid-rows-[1fr]");

              // Close all other items (Accordion behavior)
              faqItems.forEach((otherItem) => {
                if (otherItem !== item) {
                  const otherAnswer = otherItem.querySelector(".faq-answer");
                  const otherIcon = otherItem.querySelector(".icon-plus");
                  const otherTitle = otherItem.querySelector("h3");

                  otherAnswer.classList.remove("grid-rows-[1fr]");
                  otherAnswer.classList.add("grid-rows-[0fr]");
                  if (otherIcon) otherIcon.style.transform = "rotate(0deg)";
                  if (otherTitle) otherTitle.classList.remove("text-gold");
                }
              });

              // Toggle current item
              if (!isOpen) {
                answer.classList.remove("grid-rows-[0fr]");
                answer.classList.add("grid-rows-[1fr]");
                if (icon) icon.style.transform = "rotate(45deg)";
                if (title) title.classList.add("text-gold");
              } else {
                answer.classList.remove("grid-rows-[1fr]");
                answer.classList.add("grid-rows-[0fr]");
                if (icon) icon.style.transform = "rotate(0deg)";
                if (title) title.classList.remove("text-gold");
              }
            });
          });
        }
      });

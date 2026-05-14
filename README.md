# Evaluation of AI-Assisted Optimization in React Applications

This repository contains the source code and raw data for the bachelor's thesis: **Evaluation of AI-Assisted Optimization: The Impact of GitHub Copilot on Web Performance and Usability in React Applications** by Elias Bakhshi (Blekinge Institute of Technology).

The purpose of this repository is to provide complete transparency and reproducibility for the research. It contains the legacy React codebase, the AI-refactored codebase, and the raw performance and survey data used to evaluate GitHub Copilot's architectural capabilities.

## Repository Structure

This repository is divided into three main directories:

* **`/bad-ecommerce` (The Baseline):** An unoptimized React application purposefully engineered with common industry anti-patterns (e.g., synchronous main-thread locking, massive unoptimized image payloads, and deep prop-drilling).
* **`/optimized-ecommerce` (The AI Refactor):** The exact same application after being structurally refactored exclusively by GitHub Copilot (guided by strict human prompting) to resolve the underlying execution bottlenecks.
* **`/data`:** Contains the `.csv` files for all 180 Google Lighthouse audits and the 280 counterbalanced usability survey responses.

## Testing Methodology

Raw compiler speed is often masked by modern broadband and high-end developer hardware. To reproduce the exact bottlenecks discussed in the thesis, you **must** apply custom throttling before running Google Lighthouse or interacting with the applications:

1. Open Chrome DevTools (`F12`).
2. Navigate to the **Performance** tab.
3. Set **Network** to `Slow 4G`.
4. Set **CPU** to `4x slowdown`.
5. Keep the viewport set to **Desktop**.

## Getting Started

To run either application locally, navigate into their respective directories and follow the setup instructions provided in their local README files:

* [Setup the Baseline Application](./bad-ecommerce/README.md)
* [Setup the Optimized Application](./optimized-ecommerce/README.md)

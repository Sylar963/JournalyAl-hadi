# Bug Registry

This document tracks recurring or significant bugs and their solutions to prevent reintroducing them in the future.

## 1. Chart.js Dependency Conflict

-   **Symptom:** The application crashes with the error `"linear" is not a registered scale` when viewing the Trends page.
-   **Root Cause:** A module loading conflict where `react-chartjs-2` and the application code were importing two separate instances of the `chart.js` library. Manually registering scales and components would only affect one instance, while the other instance used for rendering remained unconfigured.
-   **Solution:** Update the `index.html` importmap to force `react-chartjs-2` to resolve to the same shared instance of `chart.js` used by the rest of the application. This is done by adding a `?deps=...` query parameter to the `react-chartjs-2` import URL.

    ```html
    <script type="importmap">
    {
      "imports": {
        "react-chartjs-2": "https://esm.sh/react-chartjs-2@5.2.0?deps=react@18.2.0,chart.js@4.4.3",
        "chart.js": "https://esm.sh/chart.js@4.4.3"
      }
    }
    </script>
    ```

-   **Prevention:** When adding new libraries that have peer dependencies (like `react` or `chart.js`), always verify the importmap configuration to ensure a single, shared instance of the dependency is used across the entire application.

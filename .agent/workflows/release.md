---
description: Build the frontend, check the backend, and push changes to GitHub.
---
This workflow allows the agent to automatically build, verify, and release the latest version of HydroMonitor.

1.  **Switch to Project Directory**
    - Ensure we are inside `D:\Github\HydroMonitor`

2.  **Build Frontend**
    - Navigate to `software/frontend`
    - Run `npm run build`
    - Verify the `dist` folder exists

3.  **Check Backend**
    - Navigate to `software/backend`
    - Activate venv: `venv\Scripts\activate`
    - Run dependency check: `pip freeze`

4.  **Push to GitHub**
    - Navigate to project root `D:\Github\HydroMonitor`
    - Check git status: `git status`
    - // turbo
    - Add changes: `git add .`
    - // turbo
    - Commit changes: `git commit -m "Automated build release"`
    - // turbo
    - Push to master: `git push origin master`

5.  **Notify User**
    - Confirm the release is live on GitHub.

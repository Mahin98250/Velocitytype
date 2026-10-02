/**
 * VelocityType — Application Bootstrap
 * Task 1: Project Foundation
 */

const APP_VERSION = "0.1.0";

function initializeApp() {
  // Keep the document marked as ready for future modules without
  // introducing dependencies on features that do not exist yet.
  document.documentElement.dataset.app = "velocitytype";
  document.documentElement.dataset.appVersion = APP_VERSION;

  // The foundation currently needs no runtime services. Future modules
  // will register their own initialization from this single entry point.
  return {
    name: "VelocityType",
    version: APP_VERSION,
    ready: true
  };
}

initializeApp();

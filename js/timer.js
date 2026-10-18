let examTimer = null;
let remainingSeconds = 0;
let onTimeUp = null;

const Timer = {
  start(durationMinutes, callback) {
    remainingSeconds = durationMinutes * 60;
    onTimeUp = callback;
    this.updateDisplay();
    this.startInterval();
  },

  startInterval() {
    if (examTimer) clearInterval(examTimer);

    examTimer = setInterval(() => {
      remainingSeconds--;
      this.updateDisplay();

      if (remainingSeconds <= 0) {
        this.stop();
        if (onTimeUp) onTimeUp();
      }
    }, 1000);
  },

  updateDisplay() {
    const display = document.getElementById('timerDisplay');
    if (!display) return;

    display.textContent = Utils.formatTime(remainingSeconds);
    display.classList.remove('warning', 'danger');

    if (remainingSeconds <= 60) {
      display.classList.add('danger');
    } else if (remainingSeconds <= 300) {
      display.classList.add('warning');
    }
  },

  stop() {
    if (examTimer) {
      clearInterval(examTimer);
      examTimer = null;
    }
  },

  getRemainingSeconds() {
    return remainingSeconds;
  },

  pause() {
    if (examTimer) {
      clearInterval(examTimer);
      examTimer = null;
    }
  },

  resume() {
    if (!examTimer && remainingSeconds > 0) {
      this.startInterval();
    }
  }
};

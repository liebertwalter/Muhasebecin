let debtChartInstance = null;

export function renderDebtChart(canvas, store) {
  if (!canvas || typeof Chart === "undefined") return;

  const people = store.people || [];
  const labels = people.map((p) => p.name);
  const values = people.map((p) => p.balance);

  if (debtChartInstance) {
    debtChartInstance.destroy();
  }

  debtChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Borçlar",
          data: values,
          borderWidth: 0,
          borderRadius: 12
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: "#cbd5e1" },
          grid: { display: false }
        },
        y: {
          ticks: { color: "#cbd5e1" },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

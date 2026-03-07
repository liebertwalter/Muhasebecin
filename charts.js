let muhasebeChart = null;

function grafikVerisiHazirla() {
  const kisiler = tumKisiler();
  const isimler = [];
  const borclar = [];

  kisiler.forEach((kisi) => {
    isimler.push(kisi.isim);
    borclar.push(kisi.bakiye);
  });

  return { isimler, borclar };
}

function grafikCiz() {
  const canvas = document.getElementById("grafik");
  if (!canvas || typeof Chart === "undefined") return;

  const veri = grafikVerisiHazirla();

  if (muhasebeChart) {
    muhasebeChart.destroy();
  }

  muhasebeChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: veri.isimler,
      datasets: [
        {
          label: "Borçlar",
          data: veri.borclar,
          borderWidth: 0,
          borderRadius: 12
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
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

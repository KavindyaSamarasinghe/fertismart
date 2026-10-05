import api from "../api/axiosClient";

export async function downloadRecommendationPdf(recId) {
  try {
    const res = await api.get(`/recommendations/${recId}/pdf`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(
      new Blob([res.data], { type: "application/pdf" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `FertiSmart-Recommendation-${recId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
  
    let message = "Failed to download PDF";
    try {
      const text = await err.response?.data?.text();
      message = JSON.parse(text).message || message;
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
}
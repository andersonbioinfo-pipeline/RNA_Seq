async function loadConfig() {
  const res = await fetch("config.json");
  return res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const cfg = await loadConfig();

  // ---- Drag & Drop ----
  const dropArea = document.getElementById("drop-area");
  const fileElem = document.getElementById("fileElem");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadMsg = document.getElementById("uploadMsg");

  if (dropArea) {
    dropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropArea.classList.add("dragover");
    });

    dropArea.addEventListener("dragleave", () => {
      dropArea.classList.remove("dragover");
    });

    dropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      dropArea.classList.remove("dragover");
      fileElem.files = e.dataTransfer.files;
    });

    uploadBtn.addEventListener("click", async () => {
      const files = fileElem.files;
      const email = document.getElementById("email").value;
      if (!files.length) {
        uploadMsg.textContent = "Please select at least one .fq.gz file.";
        return;
      }

      uploadMsg.textContent = "Uploading to Google Drive... ⏳";

      const formData = new FormData();
      formData.append("email", email);
      for (const file of files) {
        formData.append("file", file);
      }

      try {
        const res = await fetch(cfg.APPS_SCRIPT_URL, { method: "POST", body: formData });
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        uploadMsg.innerHTML = `
          ✅ Uploaded Successfully!<br>
          Your Job ID: <b>${data.jobId}</b><br>
          Keep it to check results later.
        `;
      } catch (err) {
        uploadMsg.textContent = "❌ Upload failed: " + err.message;
      }
    });
  }

  // ---- Check Job Status ----
  const checkBtn = document.getElementById("checkBtn");
  const jobIdInput = document.getElementById("jobId");
  const resultMsg = document.getElementById("resultMsg");

  if (checkBtn) {
    checkBtn.addEventListener("click", async () => {
      const jobId = jobIdInput.value.trim();
      if (!jobId) {
        resultMsg.textContent = "Please enter a Job ID.";
        return;
      }

      resultMsg.textContent = "Checking job status... 🔍";

      try {
        const res = await fetch(`${cfg.BACKEND_STATUS_URL}/${jobId}`);
        const data = await res.json();

        if (data.status === "not found") {
          resultMsg.textContent = "❌ Invalid Job ID.";
        } else if (data.status === "complete") {
          resultMsg.innerHTML = `✅ Job complete! <a href="${data.result_url}" target="_blank">Download Results</a>`;
        } else {
          resultMsg.textContent = "⏳ Job is still processing. Please check later.";
        }
      } catch (err) {
        resultMsg.textContent = "⚠️ Error checking status: " + err.message;
      }
    });
  }
});

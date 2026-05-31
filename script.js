const candidates = ["Alice", "John", "Emma", "David"];

let votes = {
  Alice: 0,
  John: 0,
  Emma: 0,
  David: 0
};

let voters = [];
const apiBaseUrl = "https://crudcrud.com/api/2fc7a83bcd394084894eda310a9c687d";

// UI Elements
const voteBtn = document.getElementById("voteBtn");
const resetBtn = document.getElementById("resetBtn");
const resultsDiv = document.getElementById("results");
const votersList = document.getElementById("votersList");
const voterNameInput = document.getElementById("voterName");
const candidateSelect = document.getElementById("candidateSelect");

// API Settings UI Elements
const loadingOverlay = document.getElementById("loadingOverlay");

// Enable/Disable Voting UI elements when API is not configured/loading
function disableVotingUI(disabled) {
  voteBtn.disabled = disabled;
  resetBtn.disabled = disabled;
  voterNameInput.disabled = disabled;
  candidateSelect.disabled = disabled;
}

// Show/Hide Loading Overlay
function showLoading(show) {
  loadingOverlay.style.display = show ? "flex" : "none";
}

// Fetch all votes from CrudCrud API
async function fetchVotes() {
  if (!apiBaseUrl) return;

  showLoading(true);
  try {
    const response = await fetch(`${apiBaseUrl}/votes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Reset votes counts
    votes = {
      Alice: 0,
      John: 0,
      Emma: 0,
      David: 0
    };

    // Map response data
    voters = data.map(item => {
      // Increment candidate vote count if candidate is valid
      if (votes[item.candidate] !== undefined) {
        votes[item.candidate]++;
      }
      return {
        _id: item._id,
        name: item.voterName,
        candidate: item.candidate
      };
    });

    disableVotingUI(false);
    renderResults();
  } catch (error) {
    console.error("Failed to fetch votes:", error);
    disableVotingUI(true);
    alert("Failed to connect to the CrudCrud API. Please verify the hardcoded API URL or check if it has expired (endpoints expire after 24 hours).");
  } finally {
    showLoading(false);
  }
}

// Initialize: disable voting UI until we successfully fetch the votes
disableVotingUI(true);
fetchVotes();

// Render Results UI
function renderResults() {
  resultsDiv.innerHTML = "";

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(votes));

  candidates.forEach(candidate => {
    const voteCount = votes[candidate];
    const percent = totalVotes
      ? ((voteCount / totalVotes) * 100).toFixed(1)
      : 0;

    const card = document.createElement("div");
    card.classList.add("result-card");

    if (voteCount === maxVotes && maxVotes > 0) {
      card.classList.add("winner");
    }

    card.innerHTML = `
      <div class="result-top">
        <strong>${candidate}</strong>
        <span>${voteCount} votes (${percent}%)</span>
      </div>

      <div class="progress-bar">
        <div class="progress" style="width:${percent}%"></div>
      </div>
    `;

    resultsDiv.appendChild(card);
  });

  renderVoters();
}

// Render Voters List UI
function renderVoters() {
  votersList.innerHTML = "";

  voters.forEach(voter => {
    const li = document.createElement("li");
    li.classList.add("voter-item");

    const label = document.createElement("span");
    label.textContent = `${voter.name} voted for ${voter.candidate}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-vote-btn");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteVote(voter._id));

    li.appendChild(label);
    li.appendChild(deleteBtn);
    votersList.appendChild(li);
  });
}

async function deleteVote(voteId) {
  if (!apiBaseUrl) return;

  const confirmDelete = confirm("Are you sure you want to delete this vote?");
  if (!confirmDelete) return;

  showLoading(true);
  try {
    const response = await fetch(`${apiBaseUrl}/votes/${voteId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await fetchVotes();
  } catch (error) {
    console.error("Failed to delete vote:", error);
    alert("Failed to delete this vote. Please try again.");
  } finally {
    showLoading(false);
  }
}

// Cast Vote handler
voteBtn.addEventListener("click", async () => {
  if (!apiBaseUrl) {
    alert("Please configure and connect a CrudCrud API endpoint first.");
    return;
  }

  const voterName = voterNameInput.value.trim();
  const selectedCandidate = candidateSelect.value;

  if (!voterName || !selectedCandidate) {
    alert("Please enter your name and select a candidate");
    return;
  }

  // Check if voter already voted
  const alreadyVoted = voters.find(
    voter => voter.name.toLowerCase() === voterName.toLowerCase()
  );

  if (alreadyVoted) {
    alert("You have already voted!");
    return;
  }

  showLoading(true);
  try {
    const response = await fetch(`${apiBaseUrl}/votes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        voterName: voterName,
        candidate: selectedCandidate
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    voterNameInput.value = "";
    candidateSelect.value = "";

    // Refresh the list from the API
    await fetchVotes();
  } catch (error) {
    console.error("Failed to submit vote:", error);
    alert("Failed to submit your vote. Please check your internet connection or API endpoint.");
  } finally {
    showLoading(false);
  }
});

// Reset Voting handler
resetBtn.addEventListener("click", async () => {
  if (!apiBaseUrl) return;

  const confirmReset = confirm(
    "Are you sure you want to reset all votes from the database?"
  );

  if (!confirmReset) return;

  showLoading(true);
  try {
    // Delete each vote sequentially or in parallel
    // CrudCrud does not have a bulk delete, so we delete each item by ID
    const deletePromises = voters.map(voter =>
      fetch(`${apiBaseUrl}/votes/${voter._id}`, {
        method: "DELETE"
      }).catch(err => console.error(`Failed to delete vote ${voter._id}:`, err))
    );

    await Promise.all(deletePromises);

    // Refresh data
    await fetchVotes();
  } catch (error) {
    console.error("Error during reset:", error);
    alert("Failed to reset some or all votes from the API.");
  } finally {
    showLoading(false);
  }
});

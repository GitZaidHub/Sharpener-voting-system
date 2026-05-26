const candidates = ["Alice", "John", "Emma", "David"];

let votes = JSON.parse(localStorage.getItem("votes")) || {
  Alice: 0,
  John: 0,
  Emma: 0,
  David: 0
};

let voters = JSON.parse(localStorage.getItem("voters")) || [];

const voteBtn = document.getElementById("voteBtn");
const resetBtn = document.getElementById("resetBtn");
const resultsDiv = document.getElementById("results");
const votersList = document.getElementById("votersList");

function saveData() {
  localStorage.setItem("votes", JSON.stringify(votes));
  localStorage.setItem("voters", JSON.stringify(voters));
}

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

function renderVoters() {
  votersList.innerHTML = "";

  voters.forEach(voter => {
    const li = document.createElement("li");
    li.textContent = `${voter.name} voted for ${voter.candidate}`;
    votersList.appendChild(li);
  });
}

voteBtn.addEventListener("click", () => {
  const voterName = document
    .getElementById("voterName")
    .value
    .trim();

  const selectedCandidate =
    document.getElementById("candidateSelect").value;

  if (!voterName || !selectedCandidate) {
    alert("Please enter name and select candidate");
    return;
  }

  const alreadyVoted = voters.find(
    voter => voter.name.toLowerCase() === voterName.toLowerCase()
  );

  if (alreadyVoted) {
    alert("You have already voted!");
    return;
  }

  votes[selectedCandidate]++;
  
  voters.push({
    name: voterName,
    candidate: selectedCandidate
  });

  saveData();
  renderResults();

  document.getElementById("voterName").value = "";
  document.getElementById("candidateSelect").value = "";
});

resetBtn.addEventListener("click", () => {
  const confirmReset = confirm(
    "Are you sure you want to reset all votes?"
  );

  if (!confirmReset) return;

  votes = {
    Alice: 0,
    John: 0,
    Emma: 0,
    David: 0
  };

  voters = [];

  saveData();
  renderResults();
});

renderResults();
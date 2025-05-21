const fs = require('fs');
const path = require('path');
const players = require('./data/players');

const DRAWN_NUMBERS_FILE = path.join(__dirname, 'data', 'drawn_numbers.txt');
const WINNERS_FILE = path.join(__dirname, 'data', 'winners.txt');

function initializeDataFiles() {
  const dataDir = path.join(__dirname, 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(DRAWN_NUMBERS_FILE)) {
    fs.writeFileSync(DRAWN_NUMBERS_FILE, '');
  }
  
  if (!fs.existsSync(WINNERS_FILE)) {
    fs.writeFileSync(WINNERS_FILE, '');
  }
}

function cardNumbers(startNumber, endNumber) {
  const randomNumbers = Array.from({ length: endNumber - startNumber + 1 }, (_, i) => startNumber + i);

  for (let i = randomNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomNumbers[i], randomNumbers[j]] = [randomNumbers[j], randomNumbers[i]];
  }
  
  return randomNumbers.slice(1, 6);
}

function getDrawnNumbers() {
  if (!fs.existsSync(DRAWN_NUMBERS_FILE)) {
    return [];
  }
  
  const content = fs.readFileSync(DRAWN_NUMBERS_FILE, 'utf8');
  return content ? content.split(',').map(num => parseInt(num)) : [];
}

function drawNumber() {
  const drawnNumbers = getDrawnNumbers();
  const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
  const availableNumbers = allNumbers.filter(num => !drawnNumbers.includes(num));
  
  if (availableNumbers.length === 0) {
    return false;
  }
  
  const newNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
  drawnNumbers.push(newNumber);
  fs.writeFileSync(DRAWN_NUMBERS_FILE, drawnNumbers.join(','));
  
  return newNumber;
}

function resetGame() {
  fs.writeFileSync(DRAWN_NUMBERS_FILE, '');
  fs.writeFileSync(WINNERS_FILE, '');
}

function checkWinner(cardId, playerName) {
  if (!fs.existsSync(WINNERS_FILE)) {
    fs.writeFileSync(WINNERS_FILE, '');
  }
  
  let winners = fs.readFileSync(WINNERS_FILE, 'utf8').trim();
  let winnersArray = winners ? winners.split('\n') : [];
  
  const winnerEntry = `Cartela #${cardId} - ${playerName} - ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
  
  for (const winner of winnersArray) {
    if (winner.includes(`Cartela #${cardId} - ${playerName}`)) {
      return winnersArray.length;
    }
  }
  
  winnersArray.push(winnerEntry);

  winnersArray = winnersArray.filter(line => line.trim() !== '');
  
  let content = winnersArray.join('\n');
  if (content) {
    content += '\n';
  }
  
  fs.writeFileSync(WINNERS_FILE, content);
  
  return winnersArray.length;
}

function bingoCard(cardId = null) {
  const { playerNames, avatarIcons } = players;
  
  if (cardId === null) {
    cardId = Date.now().toString();
  }
  
  const playerIndex = Math.floor(Math.random() * playerNames.length);
  const playerName = playerNames[playerIndex];
  const avatarIcon = avatarIcons[Math.floor(Math.random() * avatarIcons.length)];
  
  const bNumbers = cardNumbers(1, 15);
  const iNumbers = cardNumbers(16, 30);
  const nNumbers = cardNumbers(31, 45);
  const gNumbers = cardNumbers(46, 60);
  const oNumbers = cardNumbers(61, 75);
  
  const drawnNumbers = getDrawnNumbers();
  
  let html = `<div class="bingo-card" id="card-${cardId}" data-player="${playerName}">`;
  
  html += '<div class="player-info">';
  html += `<i class="fas fa-${avatarIcon}"></i> `;
  html += `<span class="player-name">${playerName}</span>`;
  html += '</div>';
  
  html += '<table class="table">';
  html += '<thead>';
  html += '<tr>';
  html += '<th>B</th>';
  html += '<th>I</th>';
  html += '<th>N</th>';
  html += '<th>G</th>';
  html += '<th>O</th>';
  html += '</tr>';
  html += '</thead>';
  html += '<tbody>';
  
  const cardAllNumbers = [];
  
  for (let i = 1; i <= 25; i++) {
    if (i === 1 || i === 6 || i === 11 || i === 16 || i === 21) {
      html += '<tr>';
    }
    
    if (i === 13) {
      html += '<td class="free-space marked" data-number="free">@</td>';
    } else {
      let number, marked;
      
      if (i === 1 || i === 6 || i === 11 || i === 16 || i === 21) {
        number = bNumbers.pop();
        cardAllNumbers.push(number);
        marked = drawnNumbers.includes(number) ? 'marked' : '';
        html += `<td class="${marked}" data-number="${number}">${number.toString().padStart(2, '0')}</td>`;
      } else if (i === 2 || i === 7 || i === 12 || i === 17 || i === 22) {
        number = iNumbers.pop();
        cardAllNumbers.push(number);
        marked = drawnNumbers.includes(number) ? 'marked' : '';
        html += `<td class="${marked}" data-number="${number}">${number}</td>`;
      } else if (i === 3 || i === 8 || i === 18 || i === 23) {
        number = nNumbers.pop();
        cardAllNumbers.push(number);
        marked = drawnNumbers.includes(number) ? 'marked' : '';
        html += `<td class="${marked}" data-number="${number}">${number}</td>`;
      } else if (i === 4 || i === 9 || i === 14 || i === 19 || i === 24) {
        number = gNumbers.pop();
        cardAllNumbers.push(number);
        marked = drawnNumbers.includes(number) ? 'marked' : '';
        html += `<td class="${marked}" data-number="${number}">${number}</td>`;
      } else if (i === 5 || i === 10 || i === 15 || i === 20 || i === 25) {
        number = oNumbers.pop();
        cardAllNumbers.push(number);
        marked = drawnNumbers.includes(number) ? 'marked' : '';
        html += `<td class="${marked}" data-number="${number}">${number}</td>`;
      }
    }
    
    if (i === 5 || i === 10 || i === 15 || i === 20 || i === 25) {
      html += '</tr>';
    }
  }
  
  html += '</tbody>';
  html += '</table>';
  
  const winningPatterns = checkWinningPattern(cardAllNumbers, drawnNumbers, cardId, playerName);
  if (winningPatterns && winningPatterns.length > 0) {
    html += '<div class="winner-badge">BINGO!</div>';
  }
  
  html += '</div>';
  
  return html;
}

function checkWinningPattern(cardNumbers, drawnNumbers, cardId = null, playerName = null) {
  drawnNumbers = [...drawnNumbers, 'free'];
  
  const winPatterns = [
    // Linhas
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // Colunas
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // Diagonais
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20]
  ];
  
  const matches = [];
  for (const pattern of winPatterns) {
    let match = true;
    for (const index of pattern) {
      if (!cardNumbers[index] || !drawnNumbers.includes(cardNumbers[index])) {
        match = false;
        break;
      }
    }
    if (match) {
      matches.push(pattern);
    }
  }
  
  if (matches.length > 0 && cardId !== null && playerName !== null) {
    try {
      const winnersData = fs.readFileSync(WINNERS_FILE, 'utf8');
      const existingWinners = winnersData.trim().split('\n');
      let alreadyWinner = false;
      
      for (const winner of existingWinners) {
        if (winner.includes(`Cartela #${cardId}`)) {
          alreadyWinner = true;
          break;
        }
      }
      
      if (!alreadyWinner) {
        checkWinner(cardId, playerName);
      }
    } catch (error) {
      checkWinner(cardId, playerName);
    }
  }
  
  return matches;
}

module.exports = {
  DRAWN_NUMBERS_FILE,
  WINNERS_FILE,
  initializeDataFiles,
  getDrawnNumbers,
  drawNumber,
  resetGame,
  checkWinner,
  bingoCard
};

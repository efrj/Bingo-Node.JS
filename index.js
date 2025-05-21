const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const bingo = require('./bingo');

bingo.initializeDataFiles();

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (method === 'POST' && pathname === '/') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const formData = querystring.parse(body);
      
      if (formData.winner_card && formData.winner_name) {
        bingo.checkWinner(formData.winner_card, formData.winner_name);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }
      
      if (formData.draw) {
        const newNumber = bingo.drawNumber();
        
        if (newNumber !== false) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            number: newNumber,
            message: `Número sorteado: ${newNumber}`,
            html: `<div class='alert alert-success mt-3'>Número sorteado: <strong>${newNumber}</strong></div>`
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: 'Todos os números já foram sorteados!',
            html: `<div class='alert alert-warning mt-3'>Todos os números já foram sorteados!</div>`
          }));
        }
        return;
      }
      
      if (formData.reset) {
        bingo.resetGame();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Jogo reiniciado!',
          html: `<div class='alert alert-info mt-3'>Jogo reiniciado!</div>`
        }));
        return;
      }
      
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Ação inválida' }));
    });
    return;
  }

  if (method === 'GET' && pathname === '/update') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const drawnNumbers = bingo.getDrawnNumbers();
    let drawnNumbersHtml = '';
    
    if (drawnNumbers.length > 0) {
      drawnNumbers.forEach(number => {
        drawnNumbersHtml += `<span class='number-ball'>${number}</span>`;
      });
    } else {
      drawnNumbersHtml = '<p>Nenhum número sorteado ainda.</p>';
    }
    
    res.end(JSON.stringify({ drawnNumbers, drawnNumbersHtml }));
    return;
  }

  let filePath = '';
  
  if (pathname === '/') {
    filePath = path.join(__dirname, 'views', 'index.html');
    
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro ao carregar a página');
        return;
      }

      const drawnNumbers = bingo.getDrawnNumbers();
      let drawnNumbersHtml = '';
      
      if (drawnNumbers.length > 0) {
        drawnNumbers.forEach(number => {
          drawnNumbersHtml += `<span class='number-ball'>${number}</span>`;
        });
      } else {
        drawnNumbersHtml = '<p>Nenhum número sorteado ainda.</p>';
      }

      content = content.replace('{{DRAWN_NUMBERS}}', drawnNumbersHtml);
      
      let winnersHtml = '';
      try {
        if (fs.existsSync(bingo.WINNERS_FILE)) {
          const winners = fs.readFileSync(bingo.WINNERS_FILE, 'utf8').trim();
          
          if (winners) {
            const winnersArray = winners.split('\n').filter(line => line.trim() !== '');
            
            if (winnersArray.length > 0) {
              winnersHtml = '<ul class="list-group">';
              winnersArray.forEach(winner => {
                if (winner.trim()) {
                  winnersHtml += `<li class='list-group-item'><i class='fas fa-trophy text-warning'></i> ${winner}</li>`;
                }
              });
              winnersHtml += '</ul>';
            } else {
              winnersHtml = '<p>Nenhum vencedor ainda.</p>';
            }
          } else {
            winnersHtml = '<p>Nenhum vencedor ainda.</p>';
          }
        } else {
          winnersHtml = '<p>Nenhum vencedor ainda.</p>';
        }
      } catch (error) {
        winnersHtml = '<p>Nenhum vencedor ainda.</p>';
      }
      
      content = content.replace('{{WINNERS_LIST}}', winnersHtml);

      let bingoCardsHtml = '';
      for (let i = 1; i <= 20; i++) {
        if (i === 1 || i === 5 || i === 9 || i === 13 || i === 17) {
          bingoCardsHtml += '<div class="row">';
        }
        
        bingoCardsHtml += `<div class="col-sm-12 col-md-3">${bingo.bingoCard(i)}</div>`;
        
        if (i === 4 || i === 8 || i === 12 || i === 16 || i === 20) {
          bingoCardsHtml += '</div>';
        }
      }
      
      content = content.replace('{{BINGO_CARDS}}', bingoCardsHtml);
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  } else {
    filePath = path.join(__dirname, 'public', pathname);
    
    fs.exists(filePath, (exists) => {
      if (!exists) {
        res.writeHead(404);
        res.end('Arquivo não encontrado');
        return;
      }
      
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Erro ao ler o arquivo');
          return;
        }
        
        const extname = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[extname] || 'text/plain' });
        res.end(content);
      });
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} no seu navegador`);
});

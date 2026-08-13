# Estudo de Poltronas

Painel estático que lê um CSV de vendas de passagens e responde, com evidência, **quais poltronas vendem antes — e primeiro**. Reconstrói cada viagem, ordena as compras, desenha o mapa de calor sobre a planta do veículo e simula o ganho de um reajuste.

Roda inteiramente no navegador: **nenhum dado sai da máquina**. Sem back-end, sem build, sem dependências.

Criado por Gabriel Loiola.

---

## Como publicar no GitHub Pages

1. Crie o repositório e suba estes arquivos na raiz.
2. Em **Settings → Pages**, escolha `Deploy from a branch`, branch `main`, pasta `/ (root)`.
3. Pronto. O site abre em `https://<usuario>.github.io/<repo>/`.

Todos os caminhos são relativos (`./assets/...`), então o site funciona em subpasta sem ajuste. O arquivo `.nojekyll` impede o Jekyll de ignorar diretórios.

## Cache

`sw.js` é um service worker com estratégia *stale-while-revalidate*: a página abre instantaneamente do cache e se atualiza em segundo plano. Depois do primeiro acesso, funciona offline.

**A cada deploy, suba a versão** no topo do `sw.js`:

```js
const VERSION = 'v5.0.1';
```

O `activate` apaga sozinho os caches de versões anteriores. Sem isso, o navegador continua servindo a versão antiga.

## Estrutura

```
index.html                  markup e diálogos
assets/css/app.css          folha única, com tokens de tema
assets/js/engine.js         leitura de CSV, plantas, métricas, XLSX e PDF
assets/js/app.js            interface, estado, ajustes e gráficos
sw.js                       cache
manifest.webmanifest        instalação como app
```

## Cor

A interface é **neutra por decisão de projeto** — preto, branco e grafite. A cor fica reservada ao mapa de calor, que é o único lugar onde ela carrega significado.

Em **Ajustes** (engrenagem no cabeçalho) dá para configurar:

| Opção | O que faz |
|---|---|
| Escala do mapa | nove paletas, incluindo uma em cinza para impressão em P&B |
| Inverter a intensidade | quem vende mais fica quase transparente, e a cor cheia marca as poltronas fracas — para caçar ociosidade em vez de confirmar campeãs |
| Contraste reforçado | curva na escala para separar valores próximos |
| Marcar o top 5 | contorno neutro nas cinco poltronas do ranking ativo |
| Tingir a interface | opcional: botões e barras adotam a cor do mapa |
| Tema claro · brilho de fundo | aparência geral |
| Cor no PDF | desligado, o relatório sai em escala de cinza |

Tudo é gravado em `localStorage` e vale para os próximos estudos.

## Dados

O CSV precisa de **poltrona**, **data da venda** e algo que identifique a **viagem**. Colunas de serviço, classe, canal, origem/destino e receita são opcionais e ativam filtros, detecção de planta e a simulação de preço. Os nomes das colunas são reconhecidos de forma tolerante (acentos, maiúsculas e separadores não importam).

Os estudos salvos ficam em IndexedDB, no próprio navegador.

## Limites

A simulação de reajuste é **determinística sobre dados observados**: aplica um percentual à receita já realizada e mostra quanto de venda o aumento suportaria perder antes de empatar. Ela não estima elasticidade nem prevê a reação da concorrência — a retenção de demanda é uma premissa explícita do usuário, e por isso aparece na tela e no relatório.

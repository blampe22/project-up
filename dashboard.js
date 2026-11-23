export function mountDashboard(host, panels) {
  const metrics = host.querySelector('.progress-metrics');
  const grid = host.querySelector('.progress-grid');
  const detail = host.querySelector('.progress-detail');
  const counts = [
    ['Printed', panels.filter(panel => panel.preparationStatus === 'Printed').length],
    ['Claimed', panels.filter(panel => panel.paintingStatus === 'Claimed').length],
    ['Completed', panels.filter(panel => panel.paintingStatus === 'Completed').length]
  ];
  for (const [label, count] of counts) {
    const metric = document.createElement('li');
    const value = document.createElement('strong');
    value.textContent = count + '/' + panels.length;
    metric.append(label + ' ', value);
    metrics.append(metric);
  }
  const tiles = new Map();
  let selected;
  function select(panel, tile) {
    selected?.setAttribute('aria-pressed', 'false');
    selected = tile;
    tile.setAttribute('aria-pressed', 'true');
    const label = document.createElement('strong');
    label.textContent = panel.id;
    detail.replaceChildren(label, ' · ' + panel.preparationStatus + ' · ' + panel.paintingStatus);
    if (panel.assignedPainter) detail.append(' · Painter: ' + panel.assignedPainter);
    if (panel.paintingStatus === 'Open') {
      const request = document.createElement('a');
      request.href = 'register.html?panel=' + encodeURIComponent(panel.id) + '#painting-signup-title';
      request.textContent = 'Request this panel';
      request.setAttribute('aria-label','Request ' + panel.id + ' through Family Painting Sign-Up');
      detail.append(' ', request);
    }
  }
  for (const panel of panels) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'progress-tile';
    tile.dataset.panel = panel.id;
    tile.dataset.printed = String(panel.preparationStatus === 'Printed');
    tile.dataset.painting = panel.paintingStatus;
    tile.style.gridArea = panel.row + ' / ' + panel.column;
    tile.setAttribute('aria-label', panel.id + ', row ' + panel.row + ', column ' + panel.column + ', ' + panel.preparationStatus + ', ' + panel.paintingStatus);
    tile.setAttribute('aria-pressed', 'false');
    tile.tabIndex = tiles.size ? -1 : 0;
    tile.addEventListener('click', () => {
      const previous = grid.querySelector('[tabindex="0"]');
      if (previous) previous.tabIndex = -1;
      tile.tabIndex = 0;
      select(panel, tile);
    });
    tile.addEventListener('keydown', event => {
      const offset = {ArrowUp: [-1,0],ArrowDown: [1,0],ArrowLeft: [0,-1],ArrowRight: [0,1]}[event.key];
      if (!offset) return;
      event.preventDefault();
      const next = tiles.get((panel.row + offset[0]) + ':' + (panel.column + offset[1]));
      if (next) {
        tile.tabIndex = -1;
        next.tabIndex = 0;
        next.focus();
      }
    });
    tiles.set(panel.row + ':' + panel.column,tile);
    grid.append(tile);
  }
}


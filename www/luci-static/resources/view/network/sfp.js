'use strict';
'require ui';
'require rpc';
'require poll';

var translations = {
	"en": {
		"Zaawansowana diagnostyka modułów SFP": "Advanced SFP Diagnostics",
		"Informacje o module": "Module Information",
		"Status połączenia": "Connection Status",
		"Połączony": "Connected",
		"Brak linku": "No Link",
		"Producent": "Vendor",
		"Model (PN)": "Model (PN)",
		"Numer seryjny (SN)": "Serial Number (SN)",
		"Status slotu": "Slot Status",
		"Brak wkładki SFP": "No SFP module",
		"Status połączenia (Link)": "Link Status",
		"Parametry pracy w czasie rzeczywistym (DDM)": "Real-time Diagnostics (DDM)",
		"Temperatura modułu": "Module Temperature",
		"Napięcie zasilania": "Supply Voltage",
		"Prąd lasera (Bias Current)": "Laser Bias Current",
		"Moc nadawania (TX Power)": "Transmit Power (TX)",
		"Moc odbierania (RX Power)": "Receive Power (RX)",
		"Specyfikacja techniczna": "Technical Specification",
		"Typ modułu": "Identifier",
		"Typ złącza": "Connector Type",
		"Długość fali - TX": "Wavelength - TX",
		"Szybkość nominalna": "Nominal Bitrate",
		"Kodowanie linii": "Encoding",
		"Zasięg (SMF)": "Reach (SMF)",
		"Obsługiwane standardy": "Standard Compliance",
		"Wersja (Rev)": "Revision (Rev)",
		"Data produkcji": "Manufacturing Date",
		"OUI Producenta": "Vendor OUI",
		"Statusy diagnostyczne": "Diagnostic Status",
		"Aktywne alarmy": "Active Alarms",
		"Zaimplementowane funkcje": "Implemented Options",
		"Odśwież dane": "Refresh Data",
		"SFP/Optical Transceivers": "SFP/Optical Transceivers",
		"Auto-odświeżanie": "Auto-refresh",
		"Wyłączone": "Disabled",
		"Brak (Wszystkie parametry w normie)": "None (All parameters normal)",
		"Historia parametrów sygnału": "Signal Parameters History",
		"Zbieranie danych (potrzeba min. 2 pomiarów). Ustaw auto-odświeżanie...": "Collecting data (need at least 2 measurements). Set auto-refresh...",
		"Brak": "None",
		"Ukryj": "Hide",
		"Pokaż": "Show"
	}
};

var _ = function(s) {
	var lang = document.querySelector('html').getAttribute('lang') || 'pl';
	if (lang.indexOf('en') === 0 && translations["en"] && translations["en"][s]) return translations["en"][s];
	return L.tr ? L.tr(s) : s;
};

return L.view.extend({
	handleSave: null, handleSaveApply: null, handleReset: null,

	callSfpStatus: L.rpc.declare({
		object: 'sfp',
		method: 'status',
		params: [ 'interface' ]
	}),

	updateHistory: function(iface, tx, rx, temp) {
		let key = 'sfp_hist_' + iface;
		let history = JSON.parse(sessionStorage.getItem(key) || '[]');
		let valTX = parseFloat(String(tx).replace(/[^0-9.-]/g, ''));
		let valRX = parseFloat(String(rx).replace(/[^0-9.-]/g, ''));
		let valTemp = parseFloat(String(temp).replace(/[^0-9.-]/g, ''));
		
		if (!isNaN(valTX) && !isNaN(valRX) && !isNaN(valTemp)) {
			history.push({ tx: valTX, rx: valRX, temp: valTemp });
			if (history.length > 120) history.shift();
			sessionStorage.setItem(key, JSON.stringify(history));
		}
		return history;
	},

	renderChart: function(iface, history) {
		let isHidden = sessionStorage.getItem('sfp_chart_hidden') === 'true';
		let chartContainer = E('div', { 'id': 'sfp_charts_wrapper', 'style': isHidden ? 'display:none' : 'display: flex; flex-wrap: wrap; margin: 5px -5px;' });

		if (!history || history.length < 2) {
			chartContainer.appendChild(E('em', _('Zbieranie danych (potrzeba min. 2 pomiarów). Ustaw auto-odświeżanie...')));
			return chartContainer;
		}
		
		let width = 330, height = 160, paddingL = 40, paddingR = 10, paddingT = 20, paddingB = 40;
		
		let renderSingle = (data, color, label, unit, decimals, labelColor) => {
			let vals = data.filter(v => !isNaN(v));
			let min = Math.min(...vals), max = Math.max(...vals);
			let range = max - min;
			if (range < 0.2) { min -= 0.5; max += 0.5; } else { min -= range * 0.1; max += range * 0.1; }

			let getX = (i) => paddingL + (i * (width - paddingL - paddingR) / (119));
			let getY = (v) => height - paddingB - ((v - min) * (height - paddingB - paddingT) / (max - min));

			let grid = "";
			for (let i = 0; i <= 4; i++) {
				let y = height - paddingB - (i * (height - paddingB - paddingT) / 4);
				grid += `<line x1="${paddingL}" y1="${y}" x2="${width - paddingR}" y2="${y}" stroke="#e0e0e0" stroke-dasharray="2,2" />`;
			}
			for (let i = 0; i <= 6; i++) {
				let x = paddingL + (i * (width - paddingL - paddingR) / 6);
				grid += `<line x1="${x}" y1="${paddingT}" x2="${x}" y2="${height - paddingB}" stroke="#e0e0e0" stroke-dasharray="2,2" />`;
			}

			let path = "", area = `M${paddingL},${height - paddingB}`;
			data.forEach((v, i) => {
				let x = getX(i), y = getY(v);
				path += (i === 0 ? "M" : " L") + x + "," + y;
				area += " L" + x + "," + y;
			});
			area += ` L${getX(data.length - 1)},${height - paddingB} Z`;

			return `<div style="flex: 1; min-width: 310px; margin: 5px; border: 1px solid #ccc; background: #f9f9f9; padding: 5px; border-radius: 3px;">
				<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; font-family:monospace;">
					<rect x="${paddingL}" y="${paddingT}" width="${width - paddingL - paddingR}" height="${height - paddingB - paddingT}" fill="#fff" stroke="#999" />
					${grid}
					<path d="${area}" fill="${color}" fill-opacity="0.1" />
					<path d="${path}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" />
					<text x="5" y="${getY(max) + 4}" style="font-size:9px; fill:#666">${max.toFixed(1)}</text>
					<text x="5" y="${getY(min) + 4}" style="font-size:9px; fill:#666">${min.toFixed(1)}</text>
					<text x="${paddingL}" y="${height - 10}" style="font-size:11px; fill:${labelColor}; font-weight:bold;">${label}</text>
					<text x="${width - 85}" y="${height - 10}" style="font-size:11px; fill:${color}; font-weight:bold;">Last: ${data[data.length-1].toFixed(decimals)}${unit}</text>
				</svg></div>`;
		};

		chartContainer.innerHTML = renderSingle(history.map(h => h.tx), '#0055ff', 'TX Power', 'dBm', 2, '#0055ff') + 
		               renderSingle(history.map(h => h.rx), '#22aa22', 'RX Power', 'dBm', 2, '#22aa22') +
		               renderSingle(history.map(h => h.temp), '#000000', 'Temperature', '°C', 1, '#333');
		return chartContainer;
	},

	renderSfpTable: function(iface, data) {
		if (!data || !data.ethtool) return E('div', { 'class': 'alert-message warning' }, _('Brak danych'));
		var e = data.ethtool, s = data.status || {};
		
		if (!e.vendor_name || e.vendor_name === "" || e.vendor_name === "N/A") {
			return E('div', { 'class': 'cbi-section' }, [
				E('h3', _('Informacje o module') + ' ' + iface.toUpperCase()),
				E('div', { 'class': 'table cbi-section-table' }, [
					E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td', 'style': 'width:35%' }, _('Status slotu')), E('div', { 'class': 'td' }, E('strong', { 'style': 'color:red' }, _('Brak wkładki SFP'))) ]),
					E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Status połączenia (Link)')), E('div', { 'class': 'td' }, E('strong', { 'style': 'color:red' }, _('Brak linku'))) ])
				])
			]);
		}

		let history = this.updateHistory(iface, e.tx_power_dbm, e.rx_power_dbm, e.module_temp);

		let alarmContent;
		if (e.active_alarms && e.active_alarms !== '' && e.active_alarms !== 'N/A') {
			let isWarning = e.active_alarms.toLowerCase().includes('warning') && !e.active_alarms.toLowerCase().includes('alarm');
			let color = isWarning ? 'orange' : 'red';
			alarmContent = E('strong', { 'style': 'color:' + color }, e.active_alarms.replace(/,/g, ', '));
		} else {
			alarmContent = E('strong', { 'style': 'color:green' }, _('Brak (Wszystkie parametry w normie)'));
		}

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', _('Informacje o module') + ' ' + iface.toUpperCase()),
			E('div', { 'class': 'table cbi-section-table' }, [
				E('div', { 'class': 'tr' }, [ 
					E('div', { 'class': 'td', 'style': 'width:35%' }, _('Status połączenia')), 
					E('div', { 'class': 'td' }, s.link_up ? E('strong', { 'style': 'color:green' }, _('Połączony')) : E('strong', { 'style': 'color:red' }, _('Brak linku'))) 
				]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Producent')), E('div', { 'class': 'td' }, e.vendor_name) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Model (PN)')), E('div', { 'class': 'td' }, e.vendor_pn) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Numer seryjny (SN)')), E('div', { 'class': 'td' }, e.vendor_sn) ])
			]),

			E('h3', _('Parametry pracy w czasie rzeczywistym (DDM)')),
			E('div', { 'class': 'table cbi-section-table' }, [
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td', 'style': 'width:35%' }, _('Temperatura modułu')), E('div', { 'class': 'td', 'style': 'font-weight:bold' }, e.module_temp + ' °C') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Napięcie zasilania')), E('div', { 'class': 'td' }, e.module_voltage + ' V') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Prąd lasera (Bias Current)')), E('div', { 'class': 'td' }, e.bias_current + ' mA') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Moc nadawania (TX Power)')), E('div', { 'class': 'td', 'style': 'color:#0055ff;font-weight:bold' }, e.tx_power_dbm + ' dBm (' + e.tx_power + ' mW)') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Moc odbierania (RX Power)')), E('div', { 'class': 'td', 'style': 'color:#22aa22;font-weight:bold' }, e.rx_power_dbm + ' dBm (' + e.rx_power + ' mW)') ])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'style': 'display:flex; justify-content:space-between; align-items:center;' }, [
					_('Historia parametrów sygnału'),
					E('button', {
						'class': 'btn',
						'click': function(ev) {
							let wrapper = document.getElementById('sfp_charts_wrapper');
							let isHidden = wrapper.style.display === 'none';
							wrapper.style.display = isHidden ? 'flex' : 'none';
							ev.target.textContent = isHidden ? _('Ukryj') : _('Pokaż');
							sessionStorage.setItem('sfp_chart_hidden', isHidden ? 'false' : 'true');
						}
					}, sessionStorage.getItem('sfp_chart_hidden') === 'true' ? _('Pokaż') : _('Ukryj'))
				]),
				this.renderChart(iface, history)
			]),

			E('h3', _('Specyfikacja techniczna')),
			E('div', { 'class': 'table cbi-section-table' }, [
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td', 'style': 'width:35%' }, _('Typ modułu')), E('div', { 'class': 'td' }, e.identifier_description || 'N/A') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Typ złącza')), E('div', { 'class': 'td' }, e.connector_description || 'N/A') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Długość fali - TX')), E('div', { 'class': 'td' }, e.laser_wavelength || 'N/A') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Szybkość nominalna')), E('div', { 'class': 'td' }, e.bitrate_nominal ? e.bitrate_nominal + ' Mbps' : 'N/A') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Kodowanie linii')), E('div', { 'class': 'td' }, e.encoding_description || 'N/A') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Zasięg (SMF)')), E('div', { 'class': 'td' }, e.smf_km || e.smf_m || 'N/A') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Obsługiwane standardy')), E('div', { 'class': 'td' }, e.transceiver_type || 'N/A') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Wersja (Rev)')), E('div', { 'class': 'td' }, e.vendor_rev || 'N/A') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Data produkcji')), E('div', { 'class': 'td' }, e.date_code || 'N/A') ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('OUI Producenta')), E('div', { 'class': 'td' }, e.vendor_oui || 'N/A') ])
			]),

			E('h3', _('Statusy diagnostyczne')),
			E('div', { 'class': 'table cbi-section-table' }, [
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td', 'style': 'width:35%' }, _('Aktywne alarmy')), E('div', { 'class': 'td' }, alarmContent) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class': 'td' }, _('Zaimplementowane funkcje')), E('div', { 'class': 'td' }, e.options ? e.options.replace(/,/g, ', ') : _('Brak')) ])
			])
		]);
	},

	render: function() {
		return this.callSfpStatus().then(L.bind(function(data) {
			var container = E('div');
			var activeTab = window.location.hash ? window.location.hash.substring(1) : 'sfp1';
			var update = L.bind(function() {
				this.callSfpStatus().then(L.bind(function(newData) {
					var node = document.getElementById('sfp_content');
					if (node) { node.innerHTML = ''; node.appendChild(this.renderSfpTable(activeTab, newData[activeTab])); }
				}, this));
			}, this);

			var interval = parseInt(sessionStorage.getItem('luci-sfp-refresh-interval') || '0');
			if (interval > 0) { L.Poll.add(update, interval); }

			var tabs = E('ul', { 'class': 'cbi-tabmenu' }, [
				E('li', { 'class': activeTab === 'sfp1' ? 'cbi-tab' : 'cbi-tab-disabled' }, [ E('a', { 'href': '#sfp1', 'click': (ev) => { ev.preventDefault(); activeTab = 'sfp1'; update(); window.location.hash = 'sfp1'; document.querySelectorAll('.cbi-tabmenu li').forEach(li => li.className='cbi-tab-disabled'); ev.target.parentNode.className='cbi-tab'; } }, 'SFP1 (WAN)') ]),
				E('li', { 'class': activeTab === 'sfp2' ? 'cbi-tab' : 'cbi-tab-disabled' }, [ E('a', { 'href': '#sfp2', 'click': (ev) => { ev.preventDefault(); activeTab = 'sfp2'; update(); window.location.hash = 'sfp2'; document.querySelectorAll('.cbi-tabmenu li').forEach(li => li.className='cbi-tab-disabled'); ev.target.parentNode.className='cbi-tab'; } }, 'SFP2 (LAN)') ])
			]);

			container.appendChild(E('h2', _('Zaawansowana diagnostyka modułów SFP')));
			container.appendChild(tabs);
			container.appendChild(E('div', { 'id': 'sfp_content' }, [ this.renderSfpTable(activeTab, data[activeTab]) ]));
			
			var refreshSelect = E('select', { 'style': 'margin-left:10px', 'change': (ev) => { sessionStorage.setItem('luci-sfp-refresh-interval', ev.target.value); location.reload(); }}, [
				E('option', { 'value': '0' }, _('Wyłączone')), E('option', { 'value': '5' }, '5s'), E('option', { 'value': '10' }, '10s'), E('option', { 'value': '30' }, '30s')
			]);
			refreshSelect.value = interval.toString();

			container.appendChild(E('div', { 'class': 'cbi-page-actions' }, [
				E('button', { 'class': 'btn cbi-button-action important', 'click': update }, _('Odśwież dane')),
				E('span', { 'style': 'margin-left:20px; font-weight:bold' }, _('Auto-odświeżanie') + ':'),
				refreshSelect
			]));
			return container;
		}, this));
	}
});

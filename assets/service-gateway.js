/* Onnmore India-wide location and service selector. No external API is required. */
(function () {
  'use strict';
  const LOCATION_KEY = 'onnmore_service_location_v1';
  const SERVICE_KEY = 'onnmore_selected_service_v1';
  const stateCities = {
    'Andaman and Nicobar Islands': ['Sri Vijaya Puram (Port Blair)', 'Diglipur', 'Rangat', 'Mayabunder', 'Car Nicobar', 'Swaraj Dweep (Havelock)'],
    'Andhra Pradesh': ['Amaravati', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kurnool', 'Nellore', 'Kakinada', 'Rajamahendravaram', 'Anantapur', 'Kadapa', 'Eluru', 'Ongole', 'Srikakulam', 'Vizianagaram', 'Machilipatnam', 'Chittoor', 'Tenali', 'Nandyal', 'Proddatur'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Tawang', 'Pasighat', 'Ziro', 'Bomdila', 'Tezu', 'Aalo', 'Roing'],
    'Assam': ['Guwahati', 'Dispur', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Sivasagar', 'Goalpara', 'Diphu', 'North Lakhimpur', 'Karimganj', 'Kokrajhar'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Bihar Sharif', 'Ara', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Bettiah', 'Motihari', 'Samastipur', 'Hajipur', 'Sasaram', 'Siwan', 'Kishanganj'],
    'Chandigarh': ['Chandigarh'],
    'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg', 'Bhilai', 'Korba', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Rajnandgaon', 'Dhamtari'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
    'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Narela', 'Saket', 'Karol Bagh'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Canacona'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Nadiad', 'Bharuch', 'Valsad', 'Morbi', 'Mehsana', 'Porbandar', 'Gandhidham', 'Navsari'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Hisar', 'Karnal', 'Rohtak', 'Sonipat', 'Panchkula', 'Yamunanagar', 'Rewari', 'Sirsa', 'Kurukshetra', 'Bhiwani'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Una', 'Hamirpur', 'Bilaspur', 'Chamba', 'Nahan', 'Paonta Sahib'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Sopore', 'Rajouri', 'Poonch', 'Doda'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Dumka', 'Chaibasa'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Udupi', 'Hassan', 'Raichur', 'Bidar'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Kottayam', 'Malappuram', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Ernakulam'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy', 'Andrott'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa', 'Satna', 'Ratlam', 'Dewas', 'Khandwa', 'Burhanpur', 'Chhindwara', 'Morena', 'Shivpuri'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Navi Mumbai', 'Chhatrapati Sambhajinagar', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Jalgaon', 'Akola', 'Latur', 'Sangli', 'Ahilyanagar (Ahmednagar)', 'Panvel'],
    'Manipur': ['Imphal', 'Thoubal', 'Churachandpur', 'Bishnupur', 'Ukhrul', 'Senapati', 'Moreh'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar', 'Baghmara'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip', 'Saiha'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada', 'Bhadrak', 'Jharsuguda', 'Angul', 'Koraput', 'Jeypore'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Pathankot', 'Moga', 'Firozpur', 'Sangrur', 'Barnala'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur', 'Bhilwara', 'Sikar', 'Pali', 'Sri Ganganagar', 'Jaisalmer', 'Chittorgarh', 'Barmer', 'Kishangarh'],
    'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Singtam'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Tirunelveli', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Kanchipuram', 'Nagercoil', 'Hosur', 'Karur', 'Sivakasi'],
    'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam', 'Mahbubnagar', 'Siddipet', 'Ramagundam', 'Nalgonda', 'Adilabad', 'Suryapet'],
    'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Noida', 'Greater Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Jhansi', 'Mathura', 'Ayodhya', 'Saharanpur', 'Muzaffarnagar', 'Firozabad', 'Rampur', 'Shahjahanpur', 'Etawah', 'Ballia', 'Sitapur', 'Rae Bareli', 'Unnao'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Nainital', 'Almora', 'Pithoragarh', 'Srinagar (Garhwal)', 'Mussoorie'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'New Town', 'Bidhannagar', 'Kharagpur', 'Haldia', 'Berhampore', 'Malda', 'Cooch Behar', 'Jalpaiguri', 'Bardhaman', 'Krishnanagar', 'Midnapore', 'Balurghat', 'Bankura', 'Purulia', 'Barasat']
  };

  const root = document.getElementById('onnmoreServiceGateway');
  if (!root) return;
  const byId = id => document.getElementById(id);
  const stateSelect = byId('omStateSelect');
  const citySelect = byId('omCitySelect');
  const otherCityWrap = byId('omOtherCityWrap');
  const otherCityInput = byId('omOtherCity');
  const continueState = byId('omContinueState');
  const continueCity = byId('omContinueCity');
  const query = new URLSearchParams(window.location.search);
  let savedLocation = readLocation();

  function readLocation() {
    try {
      const value = JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null');
      if (value && typeof value.state === 'string' && typeof value.city === 'string' && value.state && value.city) return value;
    } catch (_) {}
    return null;
  }
  function writeLocation(value) {
    savedLocation = value;
    try { localStorage.setItem(LOCATION_KEY, JSON.stringify(value)); } catch (_) {}
    updateLocationLabels();
  }
  function updateLocationLabels() {
    const label = savedLocation ? savedLocation.city + ', ' + savedLocation.state : 'Select your location';
    const selected = byId('omSelectedLocation');
    if (selected) selected.textContent = label;
    const summary = byId('omStateSummary');
    if (summary) summary.textContent = stateSelect.value || (savedLocation ? savedLocation.state : 'Selected state');
  }
  function fillStateOptions() {
    Object.keys(stateCities).sort((a, b) => a.localeCompare(b, 'en')).forEach(state => {
      const option = document.createElement('option');
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    });
  }
  function fillCityOptions(state, selectedCity) {
    citySelect.innerHTML = '<option value="">Choose a city</option>';
    (stateCities[state] || []).slice().sort((a, b) => a.localeCompare(b, 'en')).forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
    const other = document.createElement('option');
    other.value = '__other__';
    other.textContent = 'My city is not listed — enter it manually';
    citySelect.appendChild(other);
    if (selectedCity) {
      const exists = Array.from(citySelect.options).some(option => option.value === selectedCity);
      citySelect.value = exists ? selectedCity : '__other__';
      if (!exists) otherCityInput.value = selectedCity;
    } else {
      citySelect.value = '';
      otherCityInput.value = '';
    }
    updateOtherCityVisibility();
    validateCityStep();
  }
  function updateOtherCityVisibility() {
    const needsOther = citySelect.value === '__other__';
    otherCityWrap.hidden = !needsOther;
    otherCityInput.required = needsOther;
    if (!needsOther) otherCityInput.value = '';
    validateCityStep();
  }
  function showStage(name) {
    root.querySelectorAll('[data-om-stage]').forEach(stage => { stage.hidden = stage.getAttribute('data-om-stage') !== name; });
    root.querySelectorAll('[data-om-step-indicator]').forEach(indicator => {
      const step = indicator.getAttribute('data-om-step-indicator');
      const sequence = ['state', 'city', 'service'];
      indicator.classList.toggle('is-active', step === name);
      indicator.classList.toggle('is-done', sequence.indexOf(step) < sequence.indexOf(name));
    });
    updateLocationLabels();
    root.scrollTop = 0;
  }
  function showGateway() {
    root.classList.remove('is-hidden');
    document.body.classList.add('om-gateway-open');
  }
  function hideGateway() {
    root.classList.add('is-hidden');
    document.body.classList.remove('om-gateway-open');
  }
  function goToStateStage() {
    showGateway();
    const savedStateExists = savedLocation && Array.from(stateSelect.options).some(option => option.value === savedLocation.state);
    if (savedStateExists) {
      stateSelect.value = savedLocation.state;
      fillCityOptions(savedLocation.state, savedLocation.city);
      continueState.disabled = false;
    } else {
      stateSelect.value = '';
      fillCityOptions('', '');
      continueState.disabled = true;
    }
    showStage('state');
    stateSelect.focus({ preventScroll: true });
  }
  function validateCityStep() {
    if (!continueCity || !citySelect) return;
    const valid = citySelect.value && (citySelect.value !== '__other__' || otherCityInput.value.trim().length > 0);
    continueCity.disabled = !valid;
  }
  function cleanQuery() {
    if (window.location.search) {
      const clean = new URL(window.location.href);
      clean.searchParams.delete('change-location');
      const suffix = clean.searchParams.toString();
      window.history.replaceState({}, '', clean.pathname + (suffix ? '?' + suffix : '') + clean.hash);
    }
  }

  fillStateOptions();
  stateSelect.addEventListener('change', () => {
    continueState.disabled = !stateSelect.value;
    fillCityOptions(stateSelect.value, '');
  });
  citySelect.addEventListener('change', updateOtherCityVisibility);
  otherCityInput.addEventListener('input', validateCityStep);
  continueState.addEventListener('click', () => {
    if (!stateSelect.value) return;
    byId('omStateSummary').textContent = stateSelect.value;
    fillCityOptions(stateSelect.value, savedLocation && savedLocation.state === stateSelect.value ? savedLocation.city : '');
    showStage('city');
    citySelect.focus({ preventScroll: true });
  });
  byId('omBackToState').addEventListener('click', goToStateStage);
  continueCity.addEventListener('click', () => {
    if (continueCity.disabled) return;
    const state = stateSelect.value;
    const city = citySelect.value === '__other__' ? otherCityInput.value.trim() : citySelect.value;
    if (!state || !city) return;
    writeLocation({ state, city, country: 'India', updatedAt: new Date().toISOString() });
    showStage('service');
  });
  byId('omChangeLocation').addEventListener('click', goToStateStage);
  function attachLocationToBusinessEnquiry() {
    if (!savedLocation) return;
    const messageField = byId('ckMsg');
    if (!messageField) return;
    const locationLine = 'Selected location: ' + savedLocation.city + ', ' + savedLocation.state;
    const existingNotes = messageField.value.split(/\r?\n/)
      .filter(line => !/^Selected location:/i.test(line.trim()))
      .join('\n').trim();
    messageField.value = existingNotes ? existingNotes + '\n\n' + locationLine : locationLine;
    messageField.dispatchEvent(new Event('input', { bubbles: true }));
    messageField.dispatchEvent(new Event('change', { bubbles: true }));
  }

  byId('omChooseBusiness').addEventListener('click', () => {
    if (!savedLocation) return goToStateStage();
    try { localStorage.setItem(SERVICE_KEY, 'business-papers'); } catch (_) {}
    attachLocationToBusinessEnquiry();
    cleanQuery();
    hideGateway();
    window.setTimeout(() => {
      const target = document.getElementById('services');
      if (target) target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }, 80);
  });
  byId('omChooseIT').addEventListener('click', () => {
    if (!savedLocation) return goToStateStage();
    try { localStorage.setItem(SERVICE_KEY, 'it-support'); } catch (_) {}
    window.location.href = 'it-support.html';
  });

  window.openOnnmoreGateway = function (changeLocation) {
    if (changeLocation) goToStateStage();
    else if (savedLocation) { showGateway(); showStage('service'); }
    else goToStateStage();
  };

  if (query.get('change-location') === '1') {
    goToStateStage();
  } else if (savedLocation) {
    // Returning visitor: location already known, go straight to the site ("Change Location" reopens the selector).
    showStage('service');
    updateLocationLabels();
    attachLocationToBusinessEnquiry();
    hideGateway();
  } else {
    showStage('state');
  }
})();

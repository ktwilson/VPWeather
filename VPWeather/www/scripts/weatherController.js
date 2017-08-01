function weatherController($scope) {
    var vm = this;
    this.scope = $scope;    
    this.poweredBy = 'initializing';
    this.updateCurrent = updateCurrent;
    this.updateDaily = updateDaily;
    this.updateAlerts = updateAlerts;
    this.rotateCSS = rotateCSS;
    this.connectWS = connectWS;
   

    this.connectWS();

    setTimer();
	
	function connectWS() {			
		
		
		try 
		{
			var hostname;
								
			hostname = 'http://smart-app.live:9000';		
			
			this.wsocket = io(hostname);
			
			this.wsocket.on('current', function (data) {
				vm.poweredBy = 'ws';
				if (typeof(data) === 'string')										
					data = JSON.parse(data) 				
				vm.updateCurrent(data);		
			});
			
			this.wsocket.on('hilows', function (data) {
				vm.poweredBy = 'ws';
				var evnt;
				var hilows = data;
				if (typeof(data) === 'string')
					hilows = JSON.parse(data); 	

				vm.updateDaily(hilows);		
			});
			
			this.wsocket.on('alerts', function (data) {
				var alerts = JSON.parse(data);
				vm.updateAlerts(alerts);
			});		  
		}
		catch (e) {
			console.log('socket error:' + e);
			weatherApi();
		}		
                
	}
	
	function updateCurrent(current) {  			
		
		if (current.stormDate)
			current.stormDate = getDate(current.stormDate).toLocaleDateString();

		//console.log(current.stormDate);

		$.extend(vm,current,vm.today);

		try {
			vm.heatIndex = Math.round(HI.heatIndex({temperature: current.temperature, humidity: current.humidity, fahrenheit: true}), 2);        
		}
        catch (x) {
            console.log(x);
        }
		
		vm.lastDateLoaded = new Date();
		
	}
           

	function updateAlerts(data)
	{		
		console.log(data);
		if (data && data.length)
			vm.alerts = data[0].message;
	}

	function updateDaily(hilows) {     		
		var forecast = {};
		
		
		if (hilows.forecast) {	
			var fcast = hilows.forecast.periods;				
			forecast.today = fcast[0].fcttext;
			forecast.icon = fcast[0].icon_url;
			forecast.tonight = fcast[1].fcttext;
			forecast.tomorrow = fcast[2].fcttext;
		}	
		
		vm.forecast = forecast;
		
		vm.today = { 
			HiTemp: hilows.temperature.dailyHi, LowTemp: hilows.temperature.dailyLow,
			HiTempTime: hilows.temperature.dailyHighTime, LowTempTime: hilows.temperature.dailyLowTime,
			HiWind: hilows.windSpeed.dailyHi,
			HiWindTime: hilows.windSpeed.dailyHighTime
			};
			
		//vm.yesterday = daily.Yesterday;
		//vm.forecast = forecast;
		vm.lastUpdate = updatedSeconds(hilows.dateLoaded);
		//updateAlerts(daily.NWSAlerts);

	}
	
	function rotateCSS(degrees) {
		var rotate = "rotate(" + degrees + "deg)";

		var css = {
			'-webkit-transform': rotate,
			transform: rotate,
			'ms-transform': rotate,
			mozTransform: rotate
		};

		return css;
	}

	function updatedSeconds() {                    
		if (!vm.lastDateLoaded)
			return '';
			
		var diff = Math.abs(new Date() - vm.lastDateLoaded);
		var seconds = Math.floor(diff / 1000);
		var minutes = Math.floor(seconds / 60);
		//seconds = seconds % 60;
		var hours = Math.floor(minutes / 60);
		minutes = minutes % 60;

		return seconds;
	}

	function getDate(datestr) {
		var dt;

		if (datestr.substr(0, 5) === "/Date")
			dt = new Date(parseInt(datestr.substr(6)));
		else
			dt = new Date(datestr);

		return dt;


	}
			
	function setTimer() {		
		vm.intervalId = window.setInterval(
			(function() {
				vm.lastUpdate = updatedSeconds();
				vm.scope.$apply();
			}),1000);		 
	}
}

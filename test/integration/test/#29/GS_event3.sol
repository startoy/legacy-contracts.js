contract GS_event{
	//Get Set contract with a password (to more closely model real world contracts)
	//This one is has event defined but its not called

	event setted(int value, address changer);

	int val;
	int secret;

	function GS_event(){
		val = 42;
		secret = 16;
		return;
	}

	function set(int passNum, int newVal) returns (uint ECODE){
		if(passNum != secret){
			return 9999;
		}

		val = newVal;
		setted(newVal, msg.sender);
		return 0;
	}

	function get() constant returns(int value){
		return (val);
	}
}
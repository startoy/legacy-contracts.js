contract GS_event{
	//Get Set contract with a password (to more closely model real world contracts)
	//This one is base line, does not even have an event defined

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
		return 0;
	}

	function get() constant returns(int value){
		return (val);
	}
}
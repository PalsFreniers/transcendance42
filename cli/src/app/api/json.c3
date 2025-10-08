module app::api::json;

struct JSONObj {
	DString val;
	bool isArr;
}

macro JSONObj new() => (JSONObj) {
	.val = dstring::new(mem, "{"),
	.isArr = false,
};
macro JSONObj newArr() => (JSONObj) {
	.val = dstring::new(mem, "["),
	.isArr = true,
};

fn String JSONObj.end(&self) {
	if(!self.isArr) {
		self.val.append('}');
	} else {
		self.val.append(']');
	}
	defer self.val.free();
	return self.val.str_view().copy(mem);
}

fn void JSONObj.open(&self) {
	*self = new();
}

fn void JSONObj.setRaw(&self, String name, String value) {
	self.setStrRaw(name);
	self.val.append(':');
	self.val.append(value);
}

macro void JSONObj.setVal(&self, String name, value) {
	if(self.isArr) return;
	var $Type = $typeof(value);
	$switch $Type.typeid:
		$case String:
			self.setString(name, value);
		$case bool:
			self.setBool(name, value);
		$case int:
			self.setInt(name, value);
		$default:
			$error("unable to write unknown json object type");
	$endswitch
}

fn void JSONObj.setString(&self, String name, String value) {
	self.setStrRaw(name);
	self.val.append(':');
	self.setStrRaw(value);
}

fn void JSONObj.setBool(&self, String name, bool value) {
	self.setStrRaw(name);
	self.val.append(':');
	if(value) {
		self.val.append("true");
	} else {
		self.val.append("false");
	}
}

fn void JSONObj.setInt(&self, String name, int value) {
	self.setStrRaw(name);
	self.val.appendf(":%d", value);
}

fn void JSONObj.next(&self) => self.val.append(',');

macro void JSONObj.setStrRaw(&self, String name) @local {
	self.val.append('\"');
	self.val.append(name);
	self.val.append('\"');
}

fn void JSONObj.appendRaw(&self, String value) {
	self.val.append(value);
}

macro void JSONObj.append(&self, value) {
	if(!self.isArr) return;
	var $Type = $typeof(value);
	$switch $Type.typeid:
		$case String:
			self.appendString(value);
		$case bool:
			self.appendBool(value);
		$case int:
			self.appendInt(value);
		$default:
			$error("unable to write unknown json object type");
	$endswitch
}

fn void JSONObj.appendString(&self, String value) {
	self.setStrRaw(value);
}

fn void JSONObj.appendBool(&self, bool value) {
	if(value) {
		self.val.append("true");
	} else {
		self.val.append("false");
	}
}

fn void JSONObj.appendInt(&self, String name, int value) {
	self.val.appendf("%d", value);
}



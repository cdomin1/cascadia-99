extends RefCounted
# Same deterministic kernels as audio-dsp.mjs; composition lives in shared score.
static func synthesize(midi: float, duration: float, kind: String, rate: int) -> PackedByteArray:
	var count=maxi(1,int(round(duration*rate)))
	var data=PackedByteArray();data.resize(count*2)
	var frequency=440.0*pow(2.0,(midi-69.0)/12.0)
	var noise: int=17
	var previous=0.0
	var filtered=0.0
	for n in range(count):
		var t=n/float(rate);var u=n/float(count);var p=TAU*frequency*t
		noise=(noise*16807)%2147483647
		var white=noise/1073741823.5-1.0
		var high=white-previous*.8;previous=white
		var value=0.0
		var envelope=minf(1,t/.006)*minf(1,(duration-t)/.025)*exp(-u*2.2)
		match kind:
			"kick":
				var phase=TAU*(45*t+130.0/35.0*(1-exp(-35*t)))
				value=sin(phase)*exp(-t*19)+high*.12*exp(-t*180);envelope=minf(1,t/.0015)*minf(1,(duration-t)/.01)
			"snare": value=(high*.65+sin(TAU*175*t)*.28)*exp(-t*24);envelope=minf(1,t/.002)*minf(1,(duration-t)/.01)
			"tom": value=sin(TAU*frequency*(t+.004*(1-exp(-t*35))))*exp(-t*18)
			"pluck","sub":
				value=sin(p)*.8+sin(p*2)*.22*exp(-t*18)+sin(p*3)*.15*exp(-t*25)
				if kind=="pluck": value+=sin(p*4)*.14*exp(-t*30)
				if kind=="sub": value=sin(p)*.9+sin(p*2)*.25
			"metal","bell":
				var index=(2.6 if kind=="metal" else 1.5)*exp(-t*12)
				value=sin(p+sin(p*(2 if kind=="metal" else 3))*index)*.78+sin(p*.5)*.12;envelope*=exp(-t*(2 if kind=="bell" else 5))
			"wire": value=sin(p+sin(p*2)*.8)*.65+sin(p*3)*.16
			_:
				value=sin(p)*.72+sin(p*2)*.2+sin(p*3)*.12;envelope=minf(1,t/.012)*minf(1,(duration-t)/.035)*(.85+.15*sin(TAU*4.8*t))*exp(-u*1.3)
		filtered+=.72*(value-filtered)
		data.encode_s16(n*2,int(clampf(filtered*envelope,-1,1)*32767))
	return data

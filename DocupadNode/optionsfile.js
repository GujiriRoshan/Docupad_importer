if(payload.convertTo){ options={convertTo:payload.convertTo}}
else if(!payload.options){ options ={convertTo:"pdf"}}
else if (!payload.options.convertTo){options ={convertTo :"pdf"} }
else if(payload.options.convertTo ){ 
    console.log(typeof(payload.options.convertTo))
    const converttoTrim=payload.options.convertTo.trim();
    const converttoLength= converttoTrim.length
    if(converttoLength >0){options ={convertTo:payload.options.convertTo}}
    else{options ={convertTo:"pdf"}}
}
else if(typeof(payload.options.convertTo)== 'object')
{
    console.log("sxbjhbfs")
}
else {options ={convertTo:"pdf"}}
console.log(options)
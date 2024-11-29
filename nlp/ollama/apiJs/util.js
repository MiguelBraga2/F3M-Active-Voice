// formata para usar no postman

function codeToPostmanString(code) {
  return code
      .replace(/"/g, '\\"')       
      .replace(/\n/g, '\\n')      
      .replace(/\t/g, '\\t');      
}


const formCode = `
<ThemedText>Name:</ThemedText>
<Controller
control={control}
render={({ field: { onChange, onBlur, value } }) => (
  <ThemedInput
    onBlur={onBlur}
    onChangeText={onChange}
    value={value}
    placeholder="Enter patient's name"
  />
)}
name="name"
rules={{ required: true }}
defaultValue=""
/>

<ThemedText>Age:</ThemedText>
<Controller
control={control}
render={({ field: { onChange, onBlur, value } }) => (
  <ThemedInput
    onBlur={onBlur}
    onChangeText={onChange}
    value={value}
    placeholder="Enter patient's age"
    keyboardType="numeric"
  />
)}
name="age"
rules={{ required: true }}
defaultValue=""
/>

<ThemedText>Pain Level (0-10):</ThemedText>
<Controller
control={control}
render={({ field: { onChange, onBlur, value } }) => (
  <ThemedInput
    onBlur={onBlur}
    onChangeText={onChange}
    value={value}
    placeholder="Enter pain level"
    keyboardType="numeric"
  />
)}
name="painLevel"
rules={{ required: true, min: 0, max: 10 }}
defaultValue=""
/>

<ThemedText>Wound Size:</ThemedText>
<Controller
control={control}
render={({ field: { onChange, onBlur, value } }) => (
  <ThemedInput
    onBlur={onBlur}
    onChangeText={onChange}
    value={value}
    placeholder="Enter wound size"
    keyboardType="numeric"
  />
)}
name="woundSize"
rules={{ required: true }}
defaultValue=""
/>

<ThemedText>Unit of Measure:</ThemedText>
<Controller
control={control}
render={({ field: { onChange, value } }) => (
  <Picker
    selectedValue={value}
    onValueChange={onChange}
    style={{ height: 50, width: 150 }}
  >
    <Picker.Item label="mm" value="mm" />
    <Picker.Item label="cm" value="cm" />
  </Picker>
)}
name="unitOfMeasure"
rules={{ required: true }}
defaultValue="mm"
/>

<ThemedText>Has Pus:</ThemedText>
<Controller
control={control}
render={({ field: { onChange, value } }) => (
  <View>
    <ThemedText>Yes</ThemedText>
    <RadioButton
      value="yes"
      status={value === 'yes' ? 'checked' : 'unchecked'}
      onPress={() => onChange('yes')}
    />
    <ThemedText>No</ThemedText>
    <RadioButton
      value="no"
      status={value === 'no' ? 'checked' : 'unchecked'}
      onPress={() => onChange('no')}
    />
  </View>
)}
name="hasPus"
rules={{ required: true }}
defaultValue=""
/>
`;

console.log(codeToPostmanString(formCode));

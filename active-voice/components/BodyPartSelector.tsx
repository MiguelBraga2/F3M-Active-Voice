import React, { forwardRef } from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { ThemedText } from './ThemedText';
import { Controller, Control } from 'react-hook-form';
import { ThemedPicker } from './inputs/ThemedBodyPartPicker';
import { Svg, Path } from 'react-native-svg';
import BodySvg from '../assets/images/bodyVetor.svg';
import { painLocationOptions } from './forms/painLocation/painLocationOptins';

interface BodyPart {
    name: string;
    path: string;
    fillColor: string;           // Cor base (sem transparência)
    fillOpacity:number;         // Opacidade padrão (não selecionado)
}

interface BodyPartSelectorProps {
    control: Control<any>;
    name: string;
}

const BodyPartSelector = forwardRef<Text, BodyPartSelectorProps>(({ control, name }, ref) => {
    const bodyParts: BodyPart[] = [
        { name: 'Cabeça',path: 'M139 8L136.5 14V14.5H185L183.5 13L183 10.5L181 7L178 4L175 2L172 0.5L169 0H159H150L143.5 3.5L139 8Z',fillColor: '#FF0000', fillOpacity:0.2},
        { name: 'Região Frontal',path:'M136 15L136.5 14.5H184.5V20.5V26.5L181 27.5L176.5 28L169 29H159.5H153L143 28.5L136 27.5V15Z',fillColor:'#00FF00',fillOpacity:0.2}, 
        { name: 'Região Nasal',path:'M153 44.5L161 32L169 44.5L161 48.5L153 44.5Z',fillColor:'#4842FF',fillOpacity:0.2}, 
        { name: 'Região Auricular Esquerda',path:'M133.5 28H137L137.5 48L135 45.5L133 41.5L131.5 38V30.5L133.5 28Z',fillColor:'#EEFF00',fillOpacity:0.2}, 
        { name: 'Região Auricular Direita',path:'M180 48L181 27.5H183.5L185 28L186.5 29.5L188 32.5V39L186.5 43.5L185.5 46L183.5 48H180Z',fillColor:'#FFFF00',fillOpacity:0.2}, 
        { name: 'Boca',path:'M168.608 52.6923L171.549 53.2308L174 53.7692L168.608 55.9231L163.216 57H161.255H158.804L153.902 55.9231L149 53.2308L153.902 52.6923L158.804 51.0769L161.255 50L163.216 51.0769L168.608 52.6923Z',fillColor:'#A9A9A9',fillOpacity:0.2}, 
        { name: 'Região Occipital Esquerda',path:'M158 101V74.5135V66H176V81.1351L200 94.3784L158 101Z',fillColor:'#7E0C28',fillOpacity:0.2}, 
        { name: 'Região Occipital Direita',path:'M114 95.1667L158 101V66H144V82.5278L114 95.1667Z',fillColor:'#7E0C28',fillOpacity:0.2},
        { name: 'Lóbulo Auricular Esquerda',path:'M477 29H486V49L477 44V29Z',fillColor:'#50A096',fillOpacity:0.2}, 
        { name: 'Lóbulo Auricular Direita',path:'M532 29L526 35V46H532V29Z',fillColor:'#50A096',fillOpacity:0.2},
        { name: 'Região Peitoral Esquerda',path:'M97 104H157H221L196 189L157 154L117 189L111 160L97 104Z',fillColor:'#9B1B75',fillOpacity:0.2},
        { name: 'Região Peitoral Direita',path:'M97 104H157H221L196 189L157 154L117 189L111 160L97 104Z',fillColor:'#9B1B75',fillOpacity:0.2},
        { name: 'Clavícula Esquerda',path:'M154 100C146 98.3333 126.2 96 111 100H126H154Z',fillColor:'#1A9BBF',fillOpacity:0.2},
        { name: 'Clavícula Direita',path:'M161 101H177H200L177 107L161 101Z',fillColor:'#1A9BBF',fillOpacity:0.2},
        { name: 'Grade Costal Esquerda',path:'M116 127H102L116 188L126 181L116 127Z',fillColor:'#0B8286',fillOpacity:0.2},
        { name: 'Grade Costal Direita',path:'M200 135H211L200 188L192 181L200 135Z',fillColor:'#0B8286',fillOpacity:0.2},
        { name: 'Região Hemi-Abdominal Esquerda',path:'M132 249L112 227L109 240L128 259L132 249Z',fillColor:'#080485',fillOpacity:0.2},
        { name: 'Região Hemi-Abdominal Direita',path:'M181 249L202 227L207 236L188 255L181 249Z',fillColor:'#080485',fillOpacity:0.2},
        { name: 'Região Púbica Esquerda',path:'M459 250H451V288H459V250Z',fillColor:'#1F9735',fillOpacity:0.2},
        { name: 'Região Púbica Direita',path:'M547 253H558V282H547V253Z',fillColor:'#1F9735',fillOpacity:0.2}, 
        { name: 'Períneo',path:'M141 268L108 244L151 291H169L207 237L189 253L169 268H141Z',fillColor:'#D60C10',fillOpacity:0.2},
        { name: 'Região Supraescapular Esquerda',path:'M502 67L490 61V84L467 94L443 101L436 116H457L467 106L478 116H495V101H502V67Z',fillColor:'#78780C',fillOpacity:0.2},
        { name: 'Região Supraescapular Direita',path:'M511 70L521 65V80L540 95H559L576 113H553L547 101L535 113H521V101H511V70Z',fillColor:'#78780C',fillOpacity:0.2}, 
        { name: 'Região Escapular Esquerda',path:'M468 106L478 116L463 155L435 116H456L468 106Z',fillColor:'#060000',fillOpacity:0.2},
        { name: 'Região Escapular Direita',path:'M536 112L548 100L555 112H576L555 133L548 157L536 112Z',fillColor:'#060000',fillOpacity:0.2} ,
        { name: 'Região Toráxica Esquerda',path:'M440 117H500L495 197.524L469 206L462 184.81L450 147.726L440 117Z',fillColor:'#035D71',fillOpacity:0.2},
        { name: 'Região Toráxica Direita',path:'M533 113H517V199.609L544 209V194.391L557 155.783L571 113H533Z',fillColor:'#035D71',fillOpacity:0.2},
        { name: 'Região Lombar Esquerda',path:'M132 249L112 227L109 240L128 259L132 249Z',fillColor:'#080485',fillOpacity:0.2},
        { name: 'Região Lombar Direita',path:'M181 249L202 227L207 236L188 255L181 249Z',fillColor:'#080485',fillOpacity:0.2},
        { name: 'Região Nadegueira Esquerda',path:'M557 241.881V252.716V282.269V300H508V289.164H498V300H450V289.164V248.776L454 241.881L479 234L498 252.716H516L536 234L557 241.881Z',fillColor:'#2E939F',fillOpacity:0.2},
        { name: 'Região Nadegueira Direita',path:'M557 241.881V252.716V282.269V300H508V289.164H498V300H450V289.164V248.776L454 241.881L479 234L498 252.716H516L536 234L557 241.881Z',fillColor:'#2E939F',fillOpacity:0.2},
        { name: 'Coluna',path:'M515 101H498V216H515V101Z',fillColor:'white',fillOpacity:0.2},
        { name: 'Região Cervical',path:'M510 62H502V79H510V62Z',fillColor:'#7B7A7A',fillOpacity:0.2},
        { name: 'Ombro Esquerdo',path:'M502 67L490 61V84L467 94L443 101L436 116H457L467 106L478 116H495V101H502V67Z',fillColor:'#78780C',fillOpacity:0.2},
        { name: 'Ombro Direito',path:'M511 70L521 65V80L540 95H559L576 113H553L547 101L535 113H521V101H511V70Z',fillColor:'#78780C',fillOpacity:0.2},
        { name: 'Fossa Cubital Esquerda',path:'M98 174L74 161L54 202L82 214L98 174Z',fillColor:'#9C056A',fillOpacity:0.2},
        { name: 'Fossa Cubital Direita',path:'M246 169L223 180L237 212L263 202L246 169Z',fillColor:'#9C056A',fillOpacity:0.2},
        { name: 'Face Antebraco Esquerdo',path:'M443 169L418 163L396 211L426 218L443 169Z',fillColor:'#892828',fillOpacity:0.2},
        { name: 'Face Antebraco Direito',path:'M590 159L564 173L581 212L607 199L590 159Z',fillColor:'#892828',fillOpacity:0.2},
        { name: 'Cotovelo Esquerdo',path:'M98 174L74 161L54 202L82 214L98 174Z',fillColor:'#9C056A',fillOpacity:0.2},
        { name: 'Cotovelo Direito',path:'M246 169L223 180L237 212L263 202L246 169Z',fillColor:'#9C056A',fillOpacity:0.2}, 
        { name: 'Joelho Esquerdo',path:'M152 359H115L122 404H152V359Z',fillColor:'#881C74',fillOpacity:0.2},
        { name: 'Joelho Direito',path:'M205 359H168V405H195L205 359Z',fillColor:'#881C74',fillOpacity:0.2},
        { name: 'Terço Superior Esquerdo',path:'M83 133L94 103L110 164L83 133Z',fillColor:'#238007',fillOpacity:0.2},
        { name: 'Terço Superior Direito',path:'M206 160L222 102L232 136L206 160Z',fillColor:'#238007',fillOpacity:0.2},
        { name: 'Região Femoral Esquerda',path:'M156 310H108L115 355H151L156 310Z',fillColor:'#138C1B',fillOpacity:0.2},
        { name: 'Região Femoral Direita',path:'M211 308H164V356H206L211 308Z',fillColor:'#138C1B',fillOpacity:0.2},
        { name: 'Fossa Poplitea Esquerda',path:'M464 362H495V422H464V362Z',fillColor:'#793232',fillOpacity:0.2},
        { name: 'Fossa Poplitea Direita',path:'M546 361H513L509 420L541 423L546 361Z',fillColor:'#793232',fillOpacity:0.2},
        { name: 'Região Gemelar Esquerda',path:'M152 407H121V427H152V407Z',fillColor:'#144A71',fillOpacity:0.2},
        { name: 'Região Gemelar Direita',path:'M197 406H167V427H197V406Z',fillColor:'#144A71',fillOpacity:0.2},
        { name: 'Região Maleolar Interna Esquerda',path:'M131 483H141V494H131V483Z',fillColor:'#A61414',fillOpacity:0.2},
        { name: 'Região Maleolar Interna Direito',path:'M181 496H170V486H181V496Z',fillColor:'#780505',fillOpacity:0.2},
        { name: 'Dorso Pé Esquerdo',path:'M144 504H123V514H144V504Z',fillColor:'#ADB137',fillOpacity:0.2},
        { name: 'Dorso Pé Direito',path:'M188 505H167V513H188V505Z',fillColor:'#ADB137',fillOpacity:0.2}, 
        { name: 'Hálux esquerdo',path:'M149 516L155 526L146 530L143 516H149Z',fillColor:'#7C400B',fillOpacity:0.2},
        { name: 'Hálux Direito',path:'M171 512H165L160 525H171V512Z',fillColor:'#7C400B',fillOpacity:0.2}, 
        { name: 'Pé Esquerdo Dedo 1',path:'M149 516L155 526L146 530L143 516H149Z',fillColor:'#7C400B',fillOpacity:0.2},
        { name: 'Pé Direito Dedo 1',path:'M171 512H165L160 525H171V512Z',fillColor:'#7C400B',fillOpacity:0.2},
        { name: 'Pé Esquerdo Dedo 2',path:'M145 517H140V531H145V517Z',fillColor:'#533000',fillOpacity:0.2},
        { name: 'Pé Direito Dedo 2',path:'M178 514H171V529H178V514Z',fillColor:'#604417',fillOpacity:0.2},
        { name: 'Pé Esquerdo Dedo 3',path:'M140 514H131V529H140V514Z',fillColor:'#7C5D06',fillOpacity:0.2},
        { name: 'Pé Direito Dedo 3',path:'M184 512H179V526H184V512Z',fillColor:'#6F3A0D',fillOpacity:0.2},
        { name: 'Pé Esquerdo Dedo 4',path:'M122 525H130V514H122V525Z',fillColor:'#62380F',fillOpacity:0.2},
        { name: 'Pé Direito Dedo 4',path:'M189 514H184V526H189V514Z',fillColor:'#7B610A',fillOpacity:0.2},
        { name: 'Pé Esquerdo Dedo 5',path:'M126 513H120L112 522H120L126 513Z',fillColor:'#73511B',fillOpacity:0.2},
        { name: 'Pé Direito Dedo 5',path:'M193 516H188V524H199L193 516Z',fillColor:'#7A4016',fillOpacity:0.2},
        { name: 'Região Maleolar Externa Esquerda',path:'M485 487H477V503H485V487Z',fillColor:'#B4C265',fillOpacity:0.2},
        { name: 'Região Maleolar Externa Direita',path:'M519 485H528V503H519V485Z',fillColor:'#88A830',fillOpacity:0.2},
        { name: 'Calcânio Esquerdo',path:'M477 505H488V515H477V505Z',fillColor:'#AC7C7C',fillOpacity:0.2},
        { name: 'Calcânio Direito',path:'M524 505H514V515H524V505Z',fillColor:'#895353',fillOpacity:0.2},
        { name: 'Região Plantar Esquerdo',path:'M496 516H473V523H496V516Z',fillColor:'#530000',fillOpacity:0.2},
        { name: 'Região Plantar Direito',path:'M532 518H502V524H532V518Z',fillColor:'#75090F',fillOpacity:0.2},
        { name: 'Mão Esquerda Dedo 1',path:'M349 266L373 256L362 273H344L349 266Z',fillColor:'#915C08',fillOpacity:0.2},
        { name: 'Mão Direita Dedo 1',path:'M664 269L633 254L644 269L652 274L664 269Z',fillColor:'#510606',fillOpacity:0.2},
        { name: 'Mão Esquerda Dedo 2',path:'M363 280H355L349 293L355 301L363 280Z',fillColor:'#5D4908',fillOpacity:0.2},
        { name: 'Mão Direita Dedo 2',path:'M651 275L645 280.727L656 296L662 290.273L651 275Z',fillColor:'#632300',fillOpacity:0.2},
        { name: 'Mão Esquerda Dedo 3',path:'M369 281H364L356 301H364L369 281Z',fillColor:'#829306',fillOpacity:0.2},
        { name: 'Mão Direita Dedo 3',path:'M643 282H637L643 299H653L643 282Z',fillColor:'#170800',fillOpacity:0.2},
        { name: 'Mão Esquerda Dedo 4',path:'M375 282H370L365 301H375V282Z',fillColor:'#3A930A',fillOpacity:0.2},
        { name: 'Mão Direita Dedo 4',path:'M638 284H631L638 301H645L638 284Z',fillColor:'#5C2E16',fillOpacity:0.2},
        { name: 'Mão Esquerda Dedo 5',path:'M381 284H374V301H381V284Z',fillColor:'#811313',fillOpacity:0.2},
        { name: 'Mão Direita Dedo 5',path:'M632 284H624V299H637L632 284Z',fillColor:'#9E4A01',fillOpacity:0.2},
        { name: 'Dorso Mão Esquerda',path:'M389 260.774L375 254L360 278.194L381 284L389 260.774Z',fillColor:'#4A2802',fillOpacity:0.2},
        { name: 'Dorso Mão Direita',path:'M629.241 252L616 257.647L629.241 284L648 275.529L629.241 252Z',fillColor:'#778A0A',fillOpacity:0.2},
        { name: 'Dorso Mão Esquerda Dedo 1',path:'M349 266L373 256L362 273H344L349 266Z',fillColor:'#915C08',fillOpacity:0.2},
        { name: 'Dorso Mão Direita Dedo 1',path:'M664 269L633 254L644 269L652 274L664 269Z',fillColor:'#510606',fillOpacity:0.2},
        { name: 'Dorso Mão Esquerda Dedo 2',path:'M363 280H355L349 293L355 301L363 280Z',fillColor:'#5D4908',fillOpacity:0.2},
        { name: 'Dorso Mão Direita Dedo 2',path:'M651 275L645 280.727L656 296L662 290.273L651 275Z',fillColor:'#632300',fillOpacity:0.2},
        { name: 'Dorso Mão Esquerda Dedo 3',path:'M369 281H364L356 301H364L369 281Z',fillColor:'#829306',fillOpacity:0.2},
        { name: 'Dorso Mão Direita Dedo 3',path:'M643 282H637L643 299H653L643 282Z',fillColor:'#170800',fillOpacity:0.2},
        { name: 'Dorso Mão Esquerda Dedo 4',path:'M375 282H370L365 301H375V282Z',fillColor:'#3A930A',fillOpacity:0.2},
        { name: 'Dorso Mão Direita Dedo 4',path:'M638 284H631L638 301H645L638 284Z',fillColor:'#5C2E16',fillOpacity:0.2},
        { name: 'Dorso Mão Esquerda Dedo 5',path:'M381 284H374V301H381V284Z',fillColor:'#811313',fillOpacity:0.2},
        { name: 'Dorso Mão Direita Dedo 5',path:'M632 284H624V299H637L632 284Z',fillColor:'#9E4A01',fillOpacity:0.2},
    ];
    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                    <View style={styles.imageContainer} pointerEvents="box-none">
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.contentContainer}
                            maximumZoomScale={3}  // Nível máximo de zoom
                            minimumZoomScale={1}  // Nível mínimo de zoom
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                        >
                            <Svg height="600" width="300" viewBox="0 0 300 600">
                                {/* Renderiza o SVG de fundo */}
                                <BodySvg width="100%" height="100%" />
                                {/* Paths interativos */}
                                {bodyParts.map((part) => (
                                    <Path
                                        key={part.name}
                                        d={part.path}
                                        fill={value === part.name ? 'black' : part.fillColor}  // Cor preta ao selecionar
                                        fillOpacity={value === part.name ? 1 : 0.2}  // Opacidade total ao selecionar
                                        onPress={() => onChange(part.name)}
                                    />
                                ))}
                            </Svg>
                        </ScrollView>
                    </View>
    
                    {/* Picker para selecionar a parte do corpo */}
                    <ThemedText ref={ref}>Localização da ferida</ThemedText>
                    <ThemedPicker
                        selectedValue={value}
                        onValueChange={(itemValue) => onChange(itemValue)}
                        placeholder="Selecione uma parte do corpo"
                        options={painLocationOptions.map(part => ({ name: part }))}
                    />
                    <View style={{marginBottom: 10}}>
                        {error && <ThemedText type="error">{error.message}</ThemedText>}
                    </View>
                </>
            )}
        />
    );
    
    
});

const styles = StyleSheet.create({
    imageContainer: {
        position: 'relative',
        alignItems: 'center',
    },
    scrollView: {
        width: '100%',
        height: 600,
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default BodyPartSelector;

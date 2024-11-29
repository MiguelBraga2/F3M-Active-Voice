import { InjuryDetailsForm } from './forms/complete_form/InjuryDetails';
import { ThemedView } from './views/ThemedView';
import { StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { InjuryTipologyForm } from './forms/complete_form/InjuryTipology';
import { CleaningIntermForm } from './forms/complete_form/CleanInjuryInterm';
import { TreatmentForm } from './forms/complete_form/Tratamento';
import { AlertClassificationForm } from './forms/complete_form/ClassifAlertas';
import { FotoForm } from './forms/complete_form/ImageConfirm';
import { InjuryCharact1Form } from './forms/complete_form/InjuryCharacterisation';
import { InjuryCharact2Form } from './forms/complete_form/InjuryCharacterisation2';
import { TissuesAffectedForm } from './forms/complete_form/TissuesAffected';
import { TissuePercentageForm } from './forms/complete_form/TissuePercentage';
import { LocationForm } from './forms/complete_form/Location';
import { MedicaoFeridaForm } from '@/components/forms/complete_form/MediçãoFerida';

type Props = {
    scrollToPosition: (yPosition: number) => void;  // Função recebida como prop
};

export function CompleteForm({ scrollToPosition }: Props) {
    const [page, setPage] = useState(1); // form management
    const [formData, setFormData] = useState<any>({
        injuryDetails: {},
        location: {},
        injuryTipology: {},
        cleanInjuryInterm: {},
        treatment: {},
        alertClassification: {},
        fotoData: {},
        injuryCharact: {},
        injuryCharact2: {},
        tissuesAffected: {},
        tissuesPercentage: {},
        medicaoFerida: {}
    });

    const handleNext = (data: any) => {
        setFormData((prevFormData: any) => {
            const newFormData = { ...prevFormData, ...data };
            console.log('Form data:', newFormData);
            return newFormData;
        });

        setPage((prevPage) => {
            const nextPage = prevPage + 1;
            console.log('Página atual:', nextPage);
            return nextPage;
        });
    };

    const handlePrevious = (data: any) => {
        setFormData((prevFormData: any) => {
            const newFormData = { ...prevFormData, ...data };
            console.log('Form data:', newFormData);
            return newFormData;
        });

        setPage((prevPage) => {
            const previousPage = prevPage - 1;
            console.log('Página anterior:', previousPage);
            return previousPage;
        });
    };

    return (
            <ThemedView style={styles.form}>
                {page === 1 && (
                    <InjuryDetailsForm
                        initData={formData.injuryDetails}
                        onSubmit={(data) => handleNext({ injuryDetails: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}
                {page === 2 && (
                    <LocationForm
                        initData={formData.location}
                        onSubmit={(data) => handleNext({ location: data })}
                        onPrevious={(data) => handlePrevious({ location: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}
                {page === 3 && (
                    <InjuryTipologyForm
                        initData={formData.injuryTipology}
                        scrollToPosition={scrollToPosition}
                        onSubmit={(data) => handleNext({ injuryTipology: data })}
                        onPrevious={(data) => handlePrevious({ injuryTipology: data })}
                    />
                )}
                {page === 4 && (
                    <CleaningIntermForm
                        initData={formData.cleanInjuryInterm}
                        scrollToPosition={scrollToPosition}
                        onSubmit={(data) => handleNext({ cleanInjuryInterm: data })}
                        onPrevious={(data) => handlePrevious({ cleanInjuryInterm: data })}
                    />
                )}
                {page === 5 && (
                    <FotoForm
                        initData={formData.fotoData}
                        onSubmit={(data) => handleNext({ fotoData: data })}
                        onPrevious={(data) => handlePrevious({ fotoData: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}      
                {page === 6 && (
                    <TissuesAffectedForm
                        initData={formData.tissuesAffected}
                        onSubmit={(data) => handleNext({ tissuesAffected: data })}
                        onPrevious={(data) => handlePrevious({ tissuesAffected: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}
                {page === 7 && (
                    <MedicaoFeridaForm
                        initData={formData.medicaoFerida}
                        onSubmit={(data) => handleNext({ medicaoFerida: data })}
                        onPrevious={(data) => handlePrevious({ medicaoFerida: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}
                {page === 8 && (
                    <TissuePercentageForm
                        initData={formData.tissuesPercentage}
                        onSubmit={(data) => handleNext({ tissuesPercentage: data })}
                        onPrevious={(data) => handlePrevious({ tissuesPercentage: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}
                {page === 9 && (
                    <InjuryCharact1Form
                        initData={formData.injuryCharact}
                        onSubmit={(data) => handleNext({ injuryCharact: data })}
                        onPrevious={(data) => handlePrevious({ injuryCharact: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}
                {page === 10 && (
                    <InjuryCharact2Form
                        initData={formData.injuryCharact2}
                        onSubmit={(data) => handleNext({ injuryCharact2: data })}
                        onPrevious={(data) => handlePrevious({ injuryCharact2: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}
                {page === 11 && (
                    <TreatmentForm
                        initData={formData.treatment}
                        onSubmit={(data) => handleNext({ treatment: data })}
                        onPrevious={(data) => handlePrevious({ treatment: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}
                {page === 12 && (
                    <AlertClassificationForm
                        initData={formData.alertClassification}
                        onSubmit={(data) => handleNext({ alertClassification: data })}
                        onPrevious={(data) => handlePrevious({ alertClassification: data })}
                        scrollToPosition={scrollToPosition}
                    />
                )}
            </ThemedView>
    );
}

const styles = StyleSheet.create({
    form: {
        width: '100%',
        maxWidth: 600,
    },
});

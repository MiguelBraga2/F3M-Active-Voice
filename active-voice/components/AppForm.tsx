import { ContactInformationForm } from './forms/ContactInformationForm';
import { PersonInformationForm } from './forms/PersonInformationForm';
import { MedicalHistoryForm } from './forms/MedicalHistoryForm';
import { ThemedView } from './views/ThemedView';
import { StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { ClinicalInformationForm } from './forms/ClinicalInformationForm';
import { ThemedText } from './ThemedText';
import { CharacteristicsInformationForm } from './forms/CharacteristicsInformationForm';


type Props = {
    scrollToPosition: (yPosition: number) => void;  // Função recebida como prop
};

export function AppForm({ scrollToPosition }: Props) {
    const [page, setPage] = useState(1); // form management
    const [formData, setFormData] = useState<any>({
        contactInformation: {},
        medicalHistory: {},
        personInformation: {},
        clinicalInformation:{},
        characteristicsInformation:{},
    });

    const handleNext = (data: any) => {
        setFormData((prevFormData: any) => {
            const newFormData = { ...prevFormData, ...data };
            return newFormData;
        });

        setPage((prevPage) => {
            const nextPage = prevPage + 1;
            return nextPage;
        });
    };

    const handlePrevious = (data:any) => {
        setFormData((prevFormData: any) => {
            const newFormData = { ...prevFormData, ...data };
            return newFormData;
        });
        setPage((prevPage) => {
            const previousPage = prevPage - 1;
            return previousPage;
        });
    };

    return (
            <ThemedView style={styles.form}>
                {page === 1 && (
                    <PersonInformationForm
                        scrollToPosition={scrollToPosition}
                        initData={formData.personInformation}
                        onSubmit={(data) => handleNext({ personInformation: data })}
                    />
                )}

                {page === 2 && (
                    <ContactInformationForm
                        scrollToPosition={scrollToPosition}
                        initData={formData.contactInformation}
                        onSubmit={(data) => handleNext({ contactInformation: data })}
                        onPrevious={(data) => handlePrevious({ contactInformation: data })}
                    />
                )}

                {page === 3 && (
                    <MedicalHistoryForm
                        scrollToPosition={scrollToPosition}
                        initData={formData.medicalHistory}
                        onSubmit={(data) => handleNext({ medicalHistory: data })}
                        onPrevious={(data) => handlePrevious({ medicalHistory: data })}
                    />
                )}

                {page === 4 && (
                    <ClinicalInformationForm
                        scrollToPosition={scrollToPosition}
                        initData={formData.clinicalInformation}
                        onSubmit={(data) => handleNext({ clinicalInformation: data })}
                        onPrevious={(data) => handlePrevious({ clinicalInformation: data })}
                    />
                )}

                {page === 5 && (
                    <CharacteristicsInformationForm
                        scrollToPosition={scrollToPosition}
                        initData={formData.characteristicsInformation}
                        onSubmit={(data) => handleNext({ characteristicsInformation: data })}
                        onPrevious={(data) => handlePrevious({ characteristicsInformation: data })}
                    />
                )}

                {page === 6 && (
                    <ThemedView style={styles.animationContainer}>
                        <ThemedText type='title'>Formulário Completo</ThemedText>              
                    </ThemedView>
                )}
            </ThemedView>
    );
}

const styles = StyleSheet.create({
    form: {
        width: '100%',
        maxWidth: 600,
    },
    animationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});

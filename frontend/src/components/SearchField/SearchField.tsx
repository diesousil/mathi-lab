'use client'
import React, { FC } from 'react';
import { InputSearch, SubmitButton } from './SearchField.styled';

interface SearchFieldProps {
    placeholder: string;

}

const SearchField: FC<SearchFieldProps> = (props) => (

    <>
        <InputSearch data-testid="InputSearchField" placeholder={props.placeholder}></InputSearch>
        <SubmitButton></SubmitButton>
    </>

);

export default SearchField;

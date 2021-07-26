/* eslint-disable no-undef */
const { loadExternalFile } = require('@s1seven/schema-tools-utils');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { readFileSync } = require('fs');
const { resolve } = require('path');

const createAjvInstance = () => {
  const ajv = new Ajv({
    loadSchema: (uri) => loadExternalFile(uri, 'json'),
    strictSchema: true,
    strictNumbers: true,
    strictRequired: true,
    strictTypes: true,
    allErrors: true,
  });
  ajv.addKeyword('meta:license');
  addFormats(ajv);
  return ajv;
};

describe('Validate', function () {
  const schemaPath = resolve(__dirname, '../schema.json');
  const localSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  const validCertTestSuitesMap = [
    {
      certificateName: `valid_certificate_1`,
    },
  ];
  const invalidCertTestSuitesMap = [
    {
      certificateName: `invalid_certificate_1`,
      expectedErrors: [
        {
          instancePath: '/Certificate/Parties/Manufacturer',
          keyword: 'required',
          message: "must have required property 'Name'",
          params: {
            missingProperty: 'Name',
          },
          schemaPath: '#/required',
        },
        {
          instancePath: '/Certificate/Parties/Manufacturer/Identifier',
          keyword: 'required',
          message: "must have required property 'VAT'",
          params: {
            missingProperty: 'VAT',
          },
          schemaPath: '#/definitions/Identifier/required',
        },
        {
          instancePath: '/Certificate/BusinessTransaction/OrderConfirmation/Date',
          keyword: 'format',
          message: 'must match format "date"',
          params: {
            format: 'date',
          },
          schemaPath: '#/definitions/BusinessTransaction/properties/OrderConfirmation/properties/Date/format',
        },
        {
          instancePath: '/Certificate/BusinessTransaction/Delivery/Number',
          keyword: 'type',
          message: 'must be string',
          params: {
            type: 'string',
          },
          schemaPath: '#/definitions/BusinessTransaction/properties/Delivery/properties/Number/type',
        },
        {
          instancePath: '/Certificate/Analysis/Inspections/1',
          keyword: 'required',
          message: "must have required property 'Property'",
          params: {
            missingProperty: 'Property',
          },
          schemaPath: '#/definitions/Inspection/required',
        },
      ],
    },
  ];

  it('should validate schema', () => {
    const validateSchema = createAjvInstance().compile(localSchema);
    expect(() => validateSchema()).not.toThrow();
  });

  validCertTestSuitesMap.forEach(({ certificateName }) => {
    it(`${certificateName} should be a valid certificate`, async () => {
      const certificatePath = resolve(__dirname, `./fixtures/${certificateName}.json`);
      const certificate = JSON.parse(readFileSync(certificatePath, 'utf8'));
      const validator = await createAjvInstance().compileAsync(localSchema);
      //
      const isValid = await validator(certificate);
      expect(isValid).toBe(true);
      expect(validator.errors).toBeNull();
    });
  });

  invalidCertTestSuitesMap.forEach(({ certificateName, expectedErrors }) => {
    it(`${certificateName} should be an invalid certificate`, async () => {
      const certificatePath = resolve(__dirname, `./fixtures/${certificateName}.json`);
      const certificate = JSON.parse(readFileSync(certificatePath, 'utf8'));
      const validator = await createAjvInstance().compileAsync(localSchema);
      //
      const isValid = await validator(certificate);
      expect(isValid).toBe(false);
      expect(validator.errors).toEqual(expectedErrors);
    });
  });
});

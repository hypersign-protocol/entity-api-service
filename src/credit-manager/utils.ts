import { ATTESTAION_TYPE, RMethods, StorageType } from 'src/utils/utils';

interface ApiDetail {
  method: RMethods;
  storageType: StorageType | null;
  attestationType: ATTESTAION_TYPE | null;
}

export function getApiDetail(req): ApiDetail {
  const { method, url } = req;
  const body = req.body || {};
  if (url.includes('/did/create')) {
    return {
      method,
      storageType: StorageType.KEYSTORAGE,
      attestationType: null,
    };
  }
  if (url.includes('/did/register')) {
    return {
      method,
      storageType: null,
      attestationType: ATTESTAION_TYPE.REGISTER_DID,
    };
  }
  if (
    url.includes('/did') &&
    method === RMethods.PATCH &&
    body['didDocument']
  ) {
    return {
      method,
      storageType: null,
      attestationType: ATTESTAION_TYPE.UPDATE_DID,
    };
  }
  if (url.includes('/schema') && method === RMethods.POST) {
    return {
      method,
      storageType: null,
      attestationType: ATTESTAION_TYPE.REGISTER_SCHEMA,
    };
  }
  const [basePath, queryString] = url.split('?');
  const queryParams = new URLSearchParams(queryString || '');
  const persistQuery = queryParams.get('persist') === 'true';
  const registerCredentialStatusQuery =
    queryParams.get('registerCredentialStatus') === 'true';
  const persist = body?.persist ?? persistQuery;
  const registerCredentialStatus =
    body?.registerCredentialStatus ?? registerCredentialStatusQuery;
  if (
    url.includes('/credential/issue') &&
    persist === true &&
    registerCredentialStatus === true
  ) {
    return {
      method,
      storageType: StorageType.DATASTORAGE,
      attestationType: ATTESTAION_TYPE.REGISTER_CREDENTIAL,
    };
  } else if (
    url.includes('/credential/issue') &&
    persist === false &&
    registerCredentialStatus === true
  ) {
    return {
      method,
      storageType: null,
      attestationType: ATTESTAION_TYPE.REGISTER_CREDENTIAL,
    };
  } else if (
    url.includes('/credential/issue') &&
    persist === true &&
    registerCredentialStatus === false
  ) {
    return {
      method,
      storageType: StorageType.DATASTORAGE,
      attestationType: null,
    };
  }
  // else if (url.includes('/credential/issue') && body.persist === false && body.registerCredentialStatus === false) {
  //     return {
  //         method, storageType: null, attestationType: null
  //     }
  // } check if this goes to default case or not
  if (url.includes('/credential/verify')) {
    return {
      method,
      storageType: null,
      attestationType: null,
    };
  }
  if (url.includes('/credential/status/register')) {
    return {
      method,
      storageType: null,
      attestationType: ATTESTAION_TYPE.REGISTER_CREDENTIAL,
    };
  }
  const statusWithIdRegx = /^\/credential\/status\/[^\/]+$/;
  if (statusWithIdRegx.test(url)) {
    return {
      method,
      storageType: null,
      attestationType: ATTESTAION_TYPE.UPDATE_CREDENTIAL,
    };
  }
  return {
    method,
    storageType: null,
    attestationType: null,
  };
}

export const constant = {
  AUTHZ_URL: 'https://api.entity.dashboard.hypersign.id/api/v1/credits/authz',
};


const debugMode:boolean = true;

export function logger(title :string ,error? :any)  {
  if (error) {
    console.error(title);
    console.error(error);
  }
  else {
    console.log(title);
  }
}

export async function debug(title :string ,data?: any)  {
  if(!debugMode) return;
  console.log(title);
  if (data) console.log(data);
}
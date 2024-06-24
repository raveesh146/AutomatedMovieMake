const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Jimp = require('jimp');
const ffmpeg = require('fluent-ffmpeg');

// Your Bing Search API key (replace with your actual key)
const apiKey = '4e8b254f01ed46eea7ce369ee393012d';

// Endpoint for Bing Image Search API
const searchUrl = "https://api.bing.microsoft.com/v7.0/images/search";

// List of famous people
const names = [
    "Brad Pitt",
    "Angelina Jolie",
    "Morgan Freeman",
    "Tom Cruise",
    "Sandra Bullock",
    "Johnny Depp",
    "Keanu Reeves",
    "Scarlett Johansson",
    "Harrison Ford",
    "Anne Hathaway",
    "Heath Ledger",
    "Michael Jackson",
    "Freddie Mercury",
    "Madonna",
    "Prince",
    "Elvis Presley",
    "Whitney Houston",
    "Celine Dion",
    "Justin Bieber",
    "Selena Gomez",
    "Aishwarya Rai Bachchan",
    "Kareena Kapoor Khan",
    "Hrithik Roshan",
    "Ranbir Kapoor",
    "Madhuri Dixit",
    "Mohanlal",
    "Rajinikanth",
    "Kamal Haasan",
    "Dilip Kumar",
    "Meena Kumari",
    "Lata Mangeshkar",
    "A.R. Rahman",
    "Zubin Mehta",
    "Ravi Shankar",
    "Anoushka Shankar",
    "Jimi Hendrix",
    "Janis Joplin",
    "David Bowie",
    "Kurt Cobain",
    "Amy Winehouse",
    "J.K. Simmons",
    "Cate Blanchett",
    "Chadwick Boseman",
    "Gal Gadot",
    "Chris Evans",
    "Chris Pratt",
    "Zendaya",
    "Margot Robbie",
    "Benedict Cumberbatch",
    "Tessa Thompson",
    "Viola Davis",
    "Mahatma Gandhi",
    "Bhagat Singh",
    "Subhas Chandra Bose",
    "Sardar Vallabhbhai Patel",
    "Homi J. Bhabha",
    "Dr. B.R. Ambedkar",
    "Vikram Sarabhai",
    "C.V. Raman",
    "Srinivasa Ramanujan",
    "Dr. A.P.J. Abdul Kalam",
    "R.K. Narayan",
    "Ruskin Bond",
    "Amartya Sen",
    "Venkatraman Ramakrishnan",
    "Indra Nooyi",
    "Arundhati Roy",
    "Salman Rushdie",
    "Sunil Gavaskar",
    "Kapil Dev",
    "MS Dhoni",
    "PV Sindhu",
    "Mary Kom",
    "Sania Mirza",
    "Virender Sehwag",
    "Ravichandran Ashwin",
    "Sourav Ganguly",
    "V.V.S. Laxman",
    "Rahul Dravid",
    "Kiran Bedi",
    "Pratibha Patil",
    "L.K. Advani",
    "Narendra Modi",
    "Atal Bihari Vajpayee",
    "Rajendra Prasad",
    "Sarvepalli Radhakrishnan",
    "Zakir Hussain",
    "V.V. Giri",
    "Fakhruddin Ali Ahmed",
    "Neelam Sanjiva Reddy",
    "Giani Zail Singh",
    "Shankar Dayal Sharma",
    "K.R. Narayanan",
    "Pranab Mukherjee",
    "Ram Nath Kovind"
];




// Directories to save images, quotes, and video clips
const outputDir = "images_with_quotes";
const movieOutputDir = "movies";
const quoteOutputDir = path.join(outputDir, 'quotes');

// Create directories if they do not exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
if (!fs.existsSync(movieOutputDir)) fs.mkdirSync(movieOutputDir);
if (!fs.existsSync(quoteOutputDir)) fs.mkdirSync(quoteOutputDir);

// Function to fetch a quote from a quote API
async function fetchQuote() {
   try {
       const response = await axios.get("https://api.quotable.io/random");
       return response.data.content;
   } catch (error) {
       console.error(`Error fetching quote: ${error}`);
       return null;
   }
}

// Function to download image and save along with a quote
async function downloadImageAndSave(name) {
   const params = {
       q: name,
       count: 1,
       imageType: "photo",
       color: "Monochrome",
       size: "Large"
   };

   const headers = { "Ocp-Apim-Subscription-Key": apiKey };

   try {
       const response = await axios.get(searchUrl, { headers, params });
       const searchResults = response.data;

       if (searchResults.value && searchResults.value.length > 0) {
           const imageUrl = searchResults.value[0].contentUrl;
           const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

           // Open and save the image
           const image = await Jimp.read(imageResponse.data);
           const imagePath = path.join(outputDir, `${name.replace(' ', '_')}.jpg`);
           await image.writeAsync(imagePath);
           console.log(`Downloaded ${name}'s image and saved to ${imagePath}`);

           // Fetch a quote for the person
           const quote = await fetchQuote();

           if (quote) {
               // Save the quote to a text file with the same name as the image
               const quotePath = path.join(quoteOutputDir, `${name.replace(' ', '_')}_quote.txt`);
               fs.writeFileSync(quotePath, quote, 'utf-8');
               console.log(`Saved ${name}'s quote to ${quotePath}`);
           } else {
               console.log(`No quote found for ${name}`);
           }

       } else {
           console.log(`No images found for ${name}`);
       }

   } catch (error) {
       console.error(`Error occurred: ${error}`);
   }
}

// Function to create a fading clip from an image with centered text
async function createFadingClip(imagePath, quotePath, duration = 5) {
   try {
       const image = await Jimp.read(imagePath);
       const blankImage = new Jimp(1080, 1920, 0x00000000);

       // Calculate the position to paste the original image onto the blank image
       const left = (1080 - image.bitmap.width) / 2;
       const top = (1920 - image.bitmap.height) / 2;
       blankImage.composite(image, left, top);

       // Save the image temporarily
       const tempImagePath = path.join(outputDir, "temp_image.jpg");
       await blankImage.writeAsync(tempImagePath);

       // Load the quote
       const quote = `"${fs.readFileSync(quotePath, 'utf-8')}"`;

       // Create a text image
       const textImage = new Jimp(1080, 1920, 0x00000000);
       const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
       textImage.print(font, 10, 10, {
           text: quote,
           alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
           alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
       }, 1080, 1920);

       // Save the text image temporarily
       const tempTextPath = path.join(outputDir, "temp_text.png");
       await textImage.writeAsync(tempTextPath);

       // Create a video clip using ffmpeg
       return new Promise((resolve, reject) => {
           const outputVideoPath = path.join(movieOutputDir, path.basename(imagePath, '.jpg') + '.mp4');
           ffmpeg()
               .input(tempImagePath)
               .inputOptions('-loop 1')
               .complexFilter([
                   {
                       filter: 'fade',
                       options: { type: 'in', start_time: 0, duration: 5 },
                       inputs: '0:v',
                       outputs: 'faded'
                   },
                   {
                       filter: 'overlay',
                       options: { x: 0, y: 0 },
                       inputs: ['faded', '1:v'],
                       outputs: 'final'
                   }
               ])
               .input(tempTextPath)
               .inputOptions('-loop 1')
               .map('final')
               .outputOptions(
                   '-t', duration.toString(),
                   '-pix_fmt', 'yuv420p',  // Ensures compatibility
                   '-movflags', '+faststart'  // Helps with streaming
               )
               .on('end', () => resolve(outputVideoPath))
               .on('error', reject)
               .save(outputVideoPath);
       });
   } catch (error) {
       console.error(`Error creating fading clip for ${imagePath}: ${error}`);
       return null;
   }
}

// Function to process images in the output directory and create fading video clips
async function processImagesForVideo(directoryPath, outputDirectory, duration = 5) {
   const files = fs.readdirSync(directoryPath);

   for (const file of files) {
       const imagePath = path.join(directoryPath, file);
       if (/\.(png|jpg|jpeg|bmp|gif)$/i.test(file)) {
           const quoteFilename = `${path.parse(file).name}_quote.txt`;
           const quotePath = path.join(quoteOutputDir, quoteFilename);

           if (fs.existsSync(quotePath)) {
               console.log(`Processing ${file}...`);

               const fadingClipPath = await createFadingClip(imagePath, quotePath, duration);
               if (fadingClipPath) {
                   const outputFilename = `${path.parse(file).name}.mp4`;
                   const outputPath = path.join(outputDirectory, outputFilename);
                   fs.renameSync(fadingClipPath, outputPath);
                   console.log(`Saved fading clip to ${outputPath}`);
               } else {
                   console.log(`Skipping ${file} due to previous error.`);
               }
           } else {
               console.log(`No quote file found for ${file}`);
           }
       }
   }
}

// Process each name in the list to download images and save quotes
(async function() {
   for (const name of names) {
       console.log(`Processing ${name}...`);
       await downloadImageAndSave(name);
   }

   // Process all images in the output directory to create fading video clips
   await processImagesForVideo(outputDir, movieOutputDir);

   console.log("Image, quote download, and video creation complete.");
})();


// const fs = require('fs');
// const path = require('path');
// const axios = require('axios');
// const Jimp = require('jimp');
// const ffmpeg = require('fluent-ffmpeg');




// // Your Bing Search API key (replace with your actual key)
// const apiKey = '4e8b254f01ed46eea7ce369ee393012d';

// // Endpoint for Bing Image Search API
// const searchUrl = "https://api.bing.microsoft.com/v7.0/images/search";

// // List of famous people
// const names = [
//     "Bill Gates", "Jeff Bezos",
//     "Taylor Swift", "Barack Obama"
// ];

// // Directories to save images, quotes, and video clips
// const outputDir = "images_with_quotes";
// const movieOutputDir = "movies";
// const quoteOutputDir = path.join(outputDir, 'quotes');

// const audioPath = '/Users/raveesh/Desktop/Movie make py/auto_movie_ver_5_js/song.mp3'; // Replace with the actual path to your background music file


// // Create directories if they do not exist
// if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
// if (!fs.existsSync(movieOutputDir)) fs.mkdirSync(movieOutputDir);
// if (!fs.existsSync(quoteOutputDir)) fs.mkdirSync(quoteOutputDir);

// // Function to fetch a quote from a quote API
// async function fetchQuote() {
//     try {
//         const response = await axios.get("https://api.quotable.io/random");
//         return response.data.content;
//     } catch (error) {
//         console.error(`Error fetching quote: ${error}`);
//         return null;
//     }
// }

// // Function to download image and save along with a quote
// async function downloadImageAndSave(name) {
//     const params = {
//         q: name,
//         count: 1,
//         imageType: "photo",
//         color: "Monochrome",
//         size: "Large"
//     };

//     const headers = { "Ocp-Apim-Subscription-Key": apiKey };

//     try {
//         const response = await axios.get(searchUrl, { headers, params });
//         const searchResults = response.data;

//         if (searchResults.value && searchResults.value.length > 0) {
//             const imageUrl = searchResults.value[0].contentUrl;
//             const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

//             // Open and save the image
//             const image = await Jimp.read(imageResponse.data);
//             const imagePath = path.join(outputDir, `${name.replace(' ', '_')}.jpg`);
//             await image.writeAsync(imagePath);
//             console.log(`Downloaded ${name}'s image and saved to ${imagePath}`);

//             // Fetch a quote for the person
//             const quote = await fetchQuote();

//             if (quote) {
//                 // Save the quote to a text file with the same name as the image
//                 const quotePath = path.join(quoteOutputDir, `${name.replace(' ', '_')}_quote.txt`);
//                 fs.writeFileSync(quotePath, quote, 'utf-8');
//                 console.log(`Saved ${name}'s quote to ${quotePath}`);

//                 return { imagePath, quotePath };
//             } else {
//                 console.log(`No quote found for ${name}`);
//                 return null;
//             }

//         } else {
//             console.log(`No images found for ${name}`);
//             return null;
//         }

//     } catch (error) {
//         console.error(`Error occurred: ${error}`);
//         return null;
//     }
// }

// // Function to create a fading clip from an image with centered text and background music
// // Function to create a fading clip from an image with centered text and background music
// async function createFadingClip(imagePath, quotePath, audioPath, duration = 5) {
//     try {
//         const image = await Jimp.read(imagePath);
//         const blankImage = new Jimp(1080, 1920, 0x00000000);

//         // Calculate the position to paste the original image onto the blank image
//         const left = (1080 - image.bitmap.width) / 2;
//         const top = (1920 - image.bitmap.height) / 2;
//         blankImage.composite(image, left, top);

//         // Save the image temporarily
//         const tempImagePath = path.join(outputDir, "temp_image.jpg");
//         await blankImage.writeAsync(tempImagePath);

//         // Load the quote
//         const quote = `"${fs.readFileSync(quotePath, 'utf-8')}"`;

//         // Create a text image
//         const textImage = new Jimp(1080, 1920, 0x00000000);
//         const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
//         textImage.print(font, 10, 10, {
//             text: quote,
//             alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
//             alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
//         }, 1080, 1920);

//         // Save the text image temporarily
//         const tempTextPath = path.join(outputDir, "temp_text.png");
//         await textImage.writeAsync(tempTextPath);

//         // Create a video clip using ffmpeg with background music
//         return new Promise((resolve, reject) => {
//             const outputVideoPath = path.join(movieOutputDir, path.basename(imagePath, '.jpg') + '.mp4');

//             // Input for background music
//             const audioInput = ffmpeg(audioPath).audioCodec('aac');

//             ffmpeg()
//                 .input(tempImagePath)
//                 .inputOptions('-loop 1')
//                 .complexFilter([
//                     {
//                         filter: 'fade',
//                         options: { type: 'in', start_time: 0, duration: 5 },
//                         inputs: '0:v',
//                         outputs: 'faded'
//                     },
//                     {
//                         filter: 'overlay',
//                         options: { x: 0, y: 0 },
//                         inputs: ['faded', '1:v'],
//                         outputs: 'final'
//                     }
//                 ])
//                 .input(tempTextPath)
//                 .inputOptions('-loop 1')
//                 .map('final')
//                 .input(audioInput)
//                 .audioCodec('aac')
//                 .outputOptions(
//                     '-t', duration.toString(),
//                     '-pix_fmt', 'yuv420p',  // Ensures compatibility
//                     '-movflags', '+faststart'  // Helps with streaming
//                 )
//                 .on('end', () => resolve(outputVideoPath))
//                 .on('error', reject)
//                 .save(outputVideoPath);
//         });
//     } catch (error) {
//         console.error(`Error creating fading clip for ${imagePath}: ${error}`);
//         return null;
//     }
// }


// // Process all images in the output directory to create fading video clips with background music
// async function processImagesForVideo(directoryPath, outputDirectory, audioPath, duration = 5) {
//     const files = fs.readdirSync(directoryPath);

//     for (const file of files) {
//         const imagePath = path.join(directoryPath, file);
//         if (/\.(png|jpg|jpeg|bmp|gif)$/i.test(file)) {
//             const quoteFilename = `${path.parse(file).name}_quote.txt`;
//             const quotePath = path.join(quoteOutputDir, quoteFilename);

//             if (fs.existsSync(quotePath)) {
//                 console.log(`Processing ${file}...`);

//                 const fadingClipPath = await createFadingClip(imagePath, quotePath, audioPath, duration);
//                 if (fadingClipPath) {
//                     const outputFilename = `${path.parse(file).name}.mp4`;
//                     const outputPath = path.join(outputDirectory, outputFilename);
//                     fs.renameSync(fadingClipPath, outputPath);
//                     console.log(`Saved fading clip to ${outputPath}`);
//                 } else {
//                     console.log(`Skipping ${file} due to previous error.`);
//                 }
//             } else {
//                 console.log(`No quote file found for ${file}`);
//             }
//         }
//     }
// }


// // Main function to orchestrate the entire process
// async function main() {
//     try {
//         // Create directories if they do not exist
//         if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
//         if (!fs.existsSync(movieOutputDir)) fs.mkdirSync(movieOutputDir);
//         if (!fs.existsSync(quoteOutputDir)) fs.mkdirSync(quoteOutputDir);

//         // Download images and save quotes for each name
//         for (const name of names) {
//             console.log(`Processing ${name}...`);
//             const result = await downloadImageAndSave(name);
//             if (result) {
//                 const { imagePath, quotePath } = result;
//                 console.log(`Downloaded ${name}'s image and quote.`);
//             }
//         }

//         // Process all images in the output directory to create fading video clips with background music
//         await processImagesForVideo(outputDir, movieOutputDir, audioPath);

//         console.log("Image download, quote saving, and video creation complete.");
//     } catch (error) {
//         console.error(`Main process error: ${error}`);
//     }
// }

// // Run the main function to start the process
// main();


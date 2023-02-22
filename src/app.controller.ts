import * as ejs from 'ejs';
import { Response as Res } from 'express';
import puppeteer, { Browser, Page } from 'puppeteer';

import { Body, Controller, Post, Response, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
	/**
	 * Uses Puppeteer to generate a buffer of a PDF
	 *
	 * @private
	 * @param {Express.Multer.File} file
	 * @param {*} data
	 * @return {*}  {Promise<Buffer>}
	 * @memberof AppController
	 */
	private async generatePDF(file: Express.Multer.File, data: any): Promise<Buffer> {
		try {
			const content: string = ejs.render(Buffer.from(file.buffer).toString(), { data });

			const browser: Browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
			const page: Page = await browser.newPage();
			await page.setContent(content);

			const buffer: Buffer = await page.pdf({
				format: 'A4',
				printBackground: true,
				margin: {
					left: '0px',
					top: '0px',
					right: '0px',
					bottom: '0px'
				}
			});

			await browser.close();

			return buffer;
		} catch (error) {
			console.error(error);
		}
	}

	/**
	 * Accepts an EJS file and a data object and returns a PDF
	 *
	 * @param {Res} res
	 * @param {Express.Multer.File} file
	 * @param {*} data
	 * @return {*}  {Promise<any>}
	 * @memberof AppController
	 */
	@Post('/generate/pdf')
	@UseInterceptors(FileInterceptor('file'))
	async ejsToPdf(@Response() res: Res, @UploadedFile() file: Express.Multer.File, @Body() data: any): Promise<void> {
		try {
			const buffer: Buffer = await this.generatePDF(file, data);
			res.set({
				// pdf
				'Content-Type': 'application/pdf',
				'Content-Disposition': 'attachment; filename="attachment.pdf"',
				'Content-Length': buffer.length,
				// prevent cache
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
				Expires: 0
			});

			res.end(buffer);
		} catch (error) {
			console.error(error);
		}
	}
}

package com.lzugis.tile.model;

public class TileLevel {
	private int levelname = 0;
	
	private int minrow = 0;
	
	private int maxrow = 0;
	
	private int mincolumn = 0;
	
	private int maxcolumn = 0;
	
	private int tileCount = 0;

	public int getLevelname() {
		return levelname;
	}

	public void setLevelname(int levelname) {
		this.levelname = levelname;
	}

	public int getMinrow() {
		return minrow;
	}

	public void setMinrow(int minrow) {
		this.minrow = minrow;
	}

	public int getMaxrow() {
		return maxrow;
	}

	public void setMaxrow(int maxrow) {
		this.maxrow = maxrow;
	}

	public int getMincolumn() {
		return mincolumn;
	}

	public void setMincolumn(int mincolumn) {
		this.mincolumn = mincolumn;
	}

	public int getMaxcolumn() {
		return maxcolumn;
	}

	public void setMaxcolumn(int maxcolumn) {
		this.maxcolumn = maxcolumn;
	}

	public int getTileCount() {
		return tileCount;
	}

	public void setTileCount(int tileCount) {
		this.tileCount = tileCount;
	}
	
	
}
